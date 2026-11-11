import { type Client, createClient, LibsqlError } from "@libsql/client";
import { and, DrizzleQueryError, eq, ne, type SQL } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { join } from "path";
import process from "process";
import { WARNING_TITLE } from "../constants/notifications.js";
import logger from "../logger.js";
import type {
	Ban,
	FileFilter,
	Folderr,
	Link,
	LinkFilter,
	Notification,
	PageOptions,
	PendingMember,
	Statistics,
	Tokendb,
	Upload,
	User,
	UserFilter,
} from "./db-class";
import {
	DatabaseError,
	DBClass,
	DBConflictError,
	FolderrNotSetupError,
	normalizeInput,
} from "./db-class.js";
import * as schema from "./Schemas/SQLite/sqlite.js";

const { relations, ...tables } = schema;

function isDuplicateConstraintError(error: unknown): boolean {
	const cause = error instanceof DrizzleQueryError ? error.cause : error;
	return (
		cause instanceof LibsqlError &&
		(cause.extendedCode === "SQLITE_CONSTRAINT_UNIQUE" ||
			cause.extendedCode === "SQLITE_CONSTRAINT_PRIMARYKEY")
	);
}

/**
 * The relations a full User needs. Pass as `with` so every user query loads the same thing:
 * `this.#db.query.users.findFirst({ where, with: userWith })`
 */
const userWith = {
	notifs: {
		columns: { id: true, title: true, notify: true, createdAt: true },
	},
	cURLs: { columns: { domain: true } },
	privacy: { columns: { dataCollection: true } },
	pendingEmailChange: {
		columns: {
			pendingEmail: true,
			pendingEmailToken: true,
			tokenExpiresAt: true,
		},
	},
} as const;

/** A users row plus what `userWith` loads. Typed by shape, so a query with fewer columns still fits */
type UserRow = typeof tables.users.$inferSelect & {
	notifs: Notification[];
	cURLs: { domain: string }[];
	// optional: false in the relations, but a user created without the row still comes back null
	privacy: { dataCollection: boolean } | null;
	pendingEmailChange: {
		pendingEmail: string;
		pendingEmailToken: string;
		tokenExpiresAt: Date;
	} | null;
};

/**
 * TEMPORARY: maps a SQL user to the current Mongo-shaped User.
 * Remove once User uses `role` and nested relations directly
 */
function toUser(row: UserRow): User {
	const { role, cURLs, privacy, pendingEmailChange, ...rest } = row;
	return {
		...rest,
		owner: role === "owner",
		admin: role !== "user", // Owner = admin+
		cURLs: cURLs.map((d) => d.domain),
		privacy: { dataCollection: privacy?.dataCollection ?? false },
		pendingEmail: pendingEmailChange?.pendingEmail,
		pendingEmailToken: pendingEmailChange?.pendingEmailToken,
		tokenExpiresAt: pendingEmailChange?.tokenExpiresAt,
	};
}

/**
 * SQL's version of a page, for relational queries (`db.query.<table>.findMany`).
 * A page with one cursor pointing against its order (only `after` newest first, only `before`
 * oldest first) is read outward from the cursor and then reversed, so it doesn't jump to the
 * far end of the list. Spread `where` next to your own filters: `where: { owner, ...page.where }`
 */
function toSQLPage(page: PageOptions) {
	// Drizzle throws on an undefined filter value, so only set the bounds that exist
	const createdAt: { lt?: Date; gt?: Date } = {};
	if (page.before) createdAt.lt = page.before;
	if (page.after) createdAt.gt = page.after;
	const reverse = Boolean(
		page.ascending
			? page.before && !page.after
			: page.after && !page.before,
	);
	const ascending = reverse ? !page.ascending : Boolean(page.ascending);
	return {
		where: page.before || page.after ? { createdAt } : {},
		orderBy: { createdAt: ascending ? "asc" : "desc" } as const,
		limit: page.limit,
		reverse,
	};
}

export default class SQLiteDB extends DBClass {
	#client?: Client;
	#database?: LibSQLDatabase<typeof relations>;

	constructor() {
		super();
		this.status = "offline";
	}

	async init(url: string): Promise<void> {
		try {
			// Initalize Drizzle
			this.#client = createClient({ url });
			this.#database = drizzle({ client: this.#client, relations });
			// Run migrations
			const migrationsFolder =
				process.env.NODE_ENV === "dev"
					? "drizzle/sqlite"
					: "dist/drizzle/sqlite";
			await migrate(this.#db, {
				migrationsFolder: join(process.cwd(), migrationsFolder),
			});
			// Pre-flight: Ensure Folderr is setup
			// Not relevant to setup mode
			if (!process.env.setup) {
				await this.fetchFolderr();
			}
			this.status = "ok";
		} catch (error: unknown) {
			this.status = "offline";
			if (error instanceof FolderrNotSetupError) {
				// Folderr isn't setup
				logger.error(
					"[FATAL - DB] Folderr Database not configured\nFolderr will terminate",
				);
				process.exit(1);
			}
			// Not quite sure what happened, lets send that error in case anyone wants to make a github issue about it.
			logger.error(
				"[FATAL - DB] SQLite Database Error\nFolderr is unable to work without a database!\nFolderr will terminate",
			);
			logger.error(error);
			process.exit(1);
		}
	}

	get #db(): LibSQLDatabase<typeof relations> {
		if (!this.#database)
			throw new Error("SQLite Database used before init()");
		return this.#database;
	}

	async addBan(email: string, id: string, reason: string): Promise<Ban> {
		try {
			const [ban] = await this.#db
				.insert(tables.bans)
				.values({
					email: normalizeInput(email),
					id,
					reason: reason.trim(),
				})
				.returning();
			return ban;
		} catch (error: unknown) {
			if (isDuplicateConstraintError(error)) {
				throw new DBConflictError("Email already banned", {
					cause: error,
				});
			}
			throw new DatabaseError(
				`Unknown error occurred while banning ${email}`,
				{ cause: error },
			);
		}
	}

	async getBans(): Promise<Ban[]> {
		return this.#db.select().from(tables.bans);
	}

	async isBanned(email: string): Promise<boolean> {
		const [ban] = await this.#db
			.select()
			.from(tables.bans)
			.where(eq(tables.bans.email, normalizeInput(email)));
		return Boolean(ban);
	}

	async fetchFolderr(): Promise<Folderr> {
		const [folderr] = await this.#db
			.select()
			.from(tables.folderr)
			.where(eq(tables.folderr.id, 1))
			.limit(1);
		if (!folderr) throw new FolderrNotSetupError();
		return folderr;
	}

	/**
	 * Creates (and only creates) the Folderr object. Not to be used for updating
	 *
	 * @param {Buffer} publicKeyJWT The public key for JWT signing
	 * @returns {Folderr} Returns the new Folderr object
	 */
	async createFolderr(publicKeyJWT: Buffer): Promise<Folderr> {
		try {
			const [fldrr] = await this.#db
				.insert(tables.folderr)
				.values({ publicKeyJWT, id: 1 })
				.returning();
			return fldrr;
		} catch (error: unknown) {
			if (isDuplicateConstraintError(error)) {
				throw new DBConflictError(
					"Folderr already setup, please update instead",
					{ cause: error },
				);
			}
			throw new DatabaseError(
				"Unexpected error occurred while creating Folderr entry",
				{ cause: error },
			);
		}
	}

	async makeOwner(
		username: string,
		password: string,
		id: string,
		email: string,
	): Promise<User> {
		// Perhaps rename to `createOwner`, `make` is slightly ambigious
		try {
			return await this.#db.transaction(async (tx) => {
				const [owner] = await tx
					.insert(tables.users)
					.values({
						role: "owner",
						username: normalizeInput(username),
						password,
						id,
						email: normalizeInput(email),
					})
					.returning(); // Owner = admin+
				await tx.insert(tables.userPrivacyChoices).values({ user: id });
				return toUser({
					...owner,
					notifs: [],
					cURLs: [],
					privacy: { dataCollection: false },
					pendingEmailChange: null,
				}); // Add empty statistics here after moving to counts
			});
		} catch (error: unknown) {
			if (isDuplicateConstraintError(error)) {
				throw new DBConflictError("Owner already created!", {
					cause: error,
				});
			}
			throw new DatabaseError(
				"An unknown error occurred while creating the owner",
				{ cause: error },
			);
		}
	}

	async statistics(): Promise<Statistics> {
		const [users, files, links, bannedEmails] = await Promise.all([
			this.#db.$count(tables.users),
			this.#db.$count(tables.files),
			this.#db.$count(tables.links),
			this.#db.$count(tables.bans),
		]);
		return {
			users,
			files,
			links,
			bannedEmails,
			whitelistedEmails: 0,
		};
	}

	/* --- USER RELATED METHODS --- */

	async findUser(filter: UserFilter): Promise<User | undefined> {
		const where: {
			id?: string;
			username?: string;
			email?: string;
			role?: "owner";
			markedForDeletion?: boolean;
		} = {};
		// Drizzle throws on an undefined filter value, so only set it when given
		if (filter.markedForDeletion !== undefined)
			where.markedForDeletion = filter.markedForDeletion;

		if ("id" in filter) where.id = filter.id;
		else if ("username" in filter)
			where.username = normalizeInput(filter.username);
		else if ("email" in filter) where.email = normalizeInput(filter.email);
		else where.role = "owner";

		const row = await this.#db.query.users.findFirst({
			where,
			with: userWith,
		});
		return row ? toUser(row) : undefined;
	}

	async isUsernameTaken(username: string): Promise<boolean> {
		const [[user], [signup]] = await Promise.all([
			this.#db
				.select()
				.from(tables.users)
				.where(eq(tables.users.username, normalizeInput(username))),
			this.#db
				.select()
				.from(tables.verifyingUsers)
				.where(
					eq(
						tables.verifyingUsers.username,
						normalizeInput(username),
					),
				),
		]);
		return Boolean(user ?? signup);
	}

	async isEmailTaken(email: string): Promise<boolean> {
		const [[user], [signup], [pending]] = await Promise.all([
			this.#db
				.select()
				.from(tables.users)
				.where(eq(tables.users.email, normalizeInput(email))),
			this.#db
				.select()
				.from(tables.verifyingUsers)
				.where(eq(tables.verifyingUsers.email, normalizeInput(email))),
			this.#db
				.select()
				.from(tables.emailChanges)
				.where(
					eq(tables.emailChanges.pendingEmail, normalizeInput(email)),
				),
		]);
		return Boolean(user ?? signup ?? pending);
	}

	async listUsers(page: PageOptions): Promise<User[]> {
		const { where, orderBy, limit, reverse } = toSQLPage(page);
		const rows = await this.#db.query.users.findMany({
			where,
			orderBy,
			limit,
			with: userWith,
		});
		return (reverse ? rows.reverse() : rows).map(toUser); // Still need to transform until the definition of a user is changed
	}

	async setAdmin(id: string, admin: boolean): Promise<User | undefined> {
		const adminFilter = admin
			? ne(tables.users.role, "admin")
			: ne(tables.users.role, "user");
		const [user] = await this.#db
			.update(tables.users)
			.set({ role: admin ? "admin" : "user" })
			.where(
				and(
					eq(tables.users.id, id),
					adminFilter,
					ne(tables.users.role, "owner"),
				),
			)
			.returning();
		return user ? this.findUser({ id }) : undefined;
	}

	async updateUser(
		id: string,
		fields: Partial<
			Pick<
				User,
				| "username"
				| "password"
				| "privacy"
				| "pendingEmail"
				| "pendingEmailToken"
				| "tokenExpiresAt"
			>
		>,
	): Promise<boolean> {
		try {
			// One transaction, so a taken username doesn't leave the other changes half-saved
			return await this.#db.transaction(async (tx) => {
				let changed = false;

				// A user may not have a privacy row yet, so insert or update it
				const dataCollection = fields.privacy?.dataCollection;
				if (typeof dataCollection === "boolean") {
					await tx
						.insert(tables.userPrivacyChoices)
						.values({ user: id, dataCollection })
						.onConflictDoUpdate({
							target: tables.userPrivacyChoices.user,
							// $onUpdate doesn't run on an upsert's update, so set it here
							set: { dataCollection, updatedAt: new Date() },
						});
					changed = true;
				}

				// The route always sends all three together, and the table needs all three.
				// There's no row until the first change, so insert or replace it
				const { pendingEmail, pendingEmailToken, tokenExpiresAt } =
					fields;
				if (pendingEmail && pendingEmailToken && tokenExpiresAt) {
					const change = {
						pendingEmail: normalizeInput(pendingEmail),
						pendingEmailToken,
						tokenExpiresAt,
					};
					await tx
						.insert(tables.emailChanges)
						.values({ userId: id, ...change })
						.onConflictDoUpdate({
							target: tables.emailChanges.userId,
							set: change,
						});
					changed = true;
				}

				if (fields.username || fields.password) {
					const updated = await tx
						.update(tables.users)
						// Drizzle skips undefined keys, so only the given fields change
						.set({
							username:
								fields.username &&
								normalizeInput(fields.username),
							password: fields.password,
						})
						.where(eq(tables.users.id, id))
						.returning({ id: tables.users.id });
					changed ||= updated.length > 0;
				}

				return changed;
			});
		} catch (error: unknown) {
			if (isDuplicateConstraintError(error)) {
				throw new DBConflictError("Username or email already in use", {
					cause: error,
				});
			}
			throw new DatabaseError(
				"An unknown error occurred while updating the user",
				{
					cause: error,
				},
			);
		}
	}

	async addNotification(
		userId: string,
		notification: Pick<Notification, "id" | "title" | "notify">,
	): Promise<boolean | undefined> {
		const notificationRow = await this.#db
			.insert(tables.userNotifications)
			.values({ ...notification, userId })
			.returning();
		return notificationRow.length > 0;
	}

	async removeNotification(
		userId: string,
		id: string,
	): Promise<boolean | undefined> {
		const notification = await this.#db
			.delete(tables.userNotifications)
			.where(
				and(
					eq(tables.userNotifications.id, id),
					eq(tables.userNotifications.userId, userId),
				),
			)
			.returning();
		return notification.length > 0;
	}

	async clearNotifications(userId: string): Promise<boolean | undefined> {
		const deleted = await this.#db
			.delete(tables.userNotifications)
			.where(
				and(
					eq(tables.userNotifications.userId, userId),
					ne(tables.userNotifications.title, WARNING_TITLE),
				),
			)
			.returning({ id: tables.userNotifications.id });
		return deleted.length > 0;
	}

	async makeUser(
		userInfo: {
			username: string;
			id: string;
			password: string;
			email: string;
		},
		options?: { admin?: boolean },
	): Promise<User | undefined> {
		try {
			return await this.#db.transaction(async (tx) => {
				const [user] = await tx
					.insert(tables.users)
					.values({
						username: normalizeInput(userInfo.username),
						id: userInfo.id,
						password: userInfo.password,
						email: normalizeInput(userInfo.email),
						role: options?.admin ? "admin" : "user",
					})
					.returning();

				const [privacy] = await tx
					.insert(tables.userPrivacyChoices)
					.values({
						user: userInfo.id,
						dataCollection: false,
					})
					.returning();
				return toUser({
					...user,
					notifs: [],
					cURLs: [],
					privacy,
					pendingEmailChange: null,
				});
			});
		} catch (error: unknown) {
			if (isDuplicateConstraintError(error)) {
				return undefined;
			}
			throw new DatabaseError(
				"An unknown error occurred while creating the user in the database",
				{ cause: error },
			);
		}
	}

	async markUserForDeletion(id: string): Promise<boolean> {
		const update = await this.#db
			.update(tables.users)
			.set({ markedForDeletion: true })
			.where(eq(tables.users.id, id))
			.returning();

		return update.length > 0;
	}

	async purgeUser(id: string): Promise<{ account: boolean; links: boolean }> {
		return await this.#db.transaction(async (tx) => {
			const links = await tx
				.delete(tables.links)
				.where(eq(tables.links.owner, id));

			const [user] = await tx
				.delete(tables.users)
				.where(eq(tables.users.id, id))
				.returning();

			return {
				account: Boolean(user),
				links: links.rowsAffected > 0,
			};
		});
	}

	/* --- MIRROR RELATED METHODS --- */

	/* --- VERIFICATION RELATED METHODS --- */

	/* --- FILE RELATED METHODS --- */

	/* --- LINK RELATED METHODS --- */

	/* --- AUTHENTICATION RELATED METHODS --- */

	/* --- ADMIN RELATED METHODS --- */

	/* --- DATABASE RELATED METHODS --- */
	async shutdown(): Promise<void> {
		return this.#client?.close(); // Closes the client. Should be done after http server end
	}
}
