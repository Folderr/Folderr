import { type Client, createClient, LibsqlError } from "@libsql/client";
import {
	and,
	asc,
	DrizzleQueryError,
	desc,
	eq,
	inArray,
	lt,
	ne,
	type SQL,
} from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdir, unlink } from "fs/promises";
import { dirname, join, resolve } from "path";
import process from "process";
import { fileURLToPath } from "url";
import type { Config } from "../../handlers/config-handler.js";
import { TOKEN_EXPIRY_DAYS } from "../constants/database.js";
import { WARNING_TITLE } from "../constants/notifications.js";
import logger from "../logger.js";
import { uploadPath } from "../Utilities/upload-types.js";
import type {
	Ban,
	ContentCounts,
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
	UserWithCounts,
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

/**
 * The folder a `file:` database lives in, or undefined for in-memory and remote databases.
 * Relative paths (`file:./db/folderr.sqlite`) resolve from the working directory, like libSQL does.
 * Absolute ones can be plain (`file:/var/lib/folderr.sqlite`, `file:C:/Folderr/folderr.sqlite`)
 * or full file URLs (`file:///var/lib/folderr.sqlite`)
 */
function databaseFolder(url: string): string | undefined {
	if (!url.startsWith("file:")) return undefined;
	const path = url.slice("file:".length).split("?")[0];
	if (path === "" || path === ":memory:") return undefined;
	const file = path.startsWith("//")
		? fileURLToPath(`file:${path}`)
		: resolve(path);
	return dirname(file);
}

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
	notifications: {
		columns: { id: true, title: true, content: true, createdAt: true },
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
	notifications: Notification[];
	cURLs: { domain: string }[];
	// Created with the user in one transaction. A row removed by hand makes toUser throw for that user
	privacy: { dataCollection: boolean };
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
		privacy: { dataCollection: privacy.dataCollection },
		pendingEmail: pendingEmailChange?.pendingEmail,
		pendingEmailToken: pendingEmailChange?.pendingEmailToken,
		tokenExpiresAt: pendingEmailChange?.tokenExpiresAt,
	};
}

function toToken(row: typeof tables.tokens.$inferSelect): Tokendb {
	const { userId, description, expiresAt, ...rest } = row;
	return {
		userID: userId,
		description: description ? description : undefined,
		...rest,
		expireAt: expiresAt ? expiresAt : undefined,
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

/** A link is always matched by its ID; `owner` narrows it to that user's own link */
function linkWhere(filter: LinkFilter): SQL | undefined {
	return and(
		eq(tables.links.id, filter.id),
		filter.owner ? eq(tables.links.owner, filter.owner) : undefined,
	);
}

/**
 * An upload is always matched by its ID; `owner` and `ext` narrow it.
 * An empty `ext` still counts: it means the file has no extension, so `abc` doesn't match `abc.png`
 */
function fileWhere(filter: FileFilter): SQL | undefined {
	return and(
		eq(tables.files.id, filter.id),
		filter.owner ? eq(tables.files.owner, filter.owner) : undefined,
		filter.ext !== undefined ? eq(tables.files.ext, filter.ext) : undefined,
	);
}

export default class SQLiteDB extends DBClass {
	#client?: Client;
	#database?: LibSQLDatabase<typeof relations>;

	constructor() {
		super();
		this.status = "offline";
	}

	async init(config: Config["db"]): Promise<void> {
		const { url, authToken } = config;
		try {
			// SQLite creates the database file, but not the folder it goes in
			const folder = databaseFolder(url);
			if (folder) {
				await mkdir(folder, { recursive: true });
			}

			// Initalize Drizzle
			this.#client = createClient({ url, authToken });
			if (url.startsWith("file:")) {
				// WAL lets reads run during a write, and NORMAL skips the disk flush on every commit
				// (about 8ms each). A power cut can lose the last few commits but never corrupts the file
				await this.#client.execute("PRAGMA journal_mode = WAL");
				await this.#client.execute("PRAGMA synchronous = NORMAL");
			}
			this.#database = drizzle({ client: this.#client, relations });
			// Run migrations
			const migrationsFolder =
				process.env.NODE_ENV === "production"
					? "dist/drizzle/sqlite"
					: "drizzle/sqlite";
			await migrate(this.#db, {
				migrationsFolder: join(process.cwd(), migrationsFolder),
			});
			// Pre-flight: Ensure Folderr is setup
			// Not relevant to setup mode
			if (!process.env.setup) {
				await this.fetchFolderr(); // Should be moved outside of engine
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

	async removeBan(email: string): Promise<boolean> {
		const remove = await this.#db
			.delete(tables.bans)
			.where(eq(tables.bans.email, normalizeInput(email)))
			.returning({ id: tables.bans.id });
		return remove.length > 0;
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
				await tx
					.insert(tables.userPrivacyChoices)
					.values({ userId: id });
				return toUser({
					...owner,
					notifications: [],
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
	async countContent(userId: string): Promise<ContentCounts> {
		const [files, links] = await Promise.all([
			this.#db.$count(tables.files, eq(tables.files.owner, userId)),
			this.#db.$count(tables.links, eq(tables.links.owner, userId)),
		]);
		return { files, links };
	}

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
				.select({ id: tables.users.id })
				.from(tables.users)
				.where(eq(tables.users.username, normalizeInput(username)))
				.limit(1),
			this.#db
				.select({ id: tables.verifyingUsers.id })
				.from(tables.verifyingUsers)
				.where(
					eq(
						tables.verifyingUsers.username,
						normalizeInput(username),
					),
				)
				.limit(1),
		]);
		return Boolean(user ?? signup);
	}

	async isEmailTaken(email: string): Promise<boolean> {
		const [[user], [signup], [pending]] = await Promise.all([
			this.#db
				.select({ id: tables.users.id })
				.from(tables.users)
				.where(eq(tables.users.email, normalizeInput(email)))
				.limit(1),
			this.#db
				.select({ id: tables.verifyingUsers.id })
				.from(tables.verifyingUsers)
				.where(eq(tables.verifyingUsers.email, normalizeInput(email)))
				.limit(1),
			this.#db
				.select({ pendingEmail: tables.emailChanges.pendingEmail })
				.from(tables.emailChanges)
				.where(
					eq(tables.emailChanges.pendingEmail, normalizeInput(email)),
				)
				.limit(1),
		]);
		return Boolean(user ?? signup ?? pending);
	}

	async listUsers(page: PageOptions): Promise<UserWithCounts[]> {
		const { where, orderBy, limit, reverse } = toSQLPage(page);
		const rows = await this.#db.query.users.findMany({
			where,
			orderBy,
			limit,
			with: userWith,
			extras: {
				files: (users: typeof tables.users) =>
					this.#db.$count(
						tables.files,
						eq(tables.files.owner, users.id),
					),
				links: (users: typeof tables.users) =>
					this.#db.$count(
						tables.links,
						eq(tables.links.owner, users.id),
					),
			},
		});
		return (reverse ? rows.reverse() : rows).map((user) => ({
			...toUser(user),
			files: user.files,
			links: user.links,
		})); // Still need to transform until the definition of a user is changed
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

				// Upsert rather than update: a plain update on a missing row would silently save nothing
				const dataCollection = fields.privacy?.dataCollection;
				if (typeof dataCollection === "boolean") {
					await tx
						.insert(tables.userPrivacyChoices)
						.values({ userId: id, dataCollection })
						.onConflictDoUpdate({
							target: tables.userPrivacyChoices.userId,
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
		notification: Pick<Notification, "id" | "title" | "content">,
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
						userId: userInfo.id,
						dataCollection: false,
					})
					.returning();
				return toUser({
					...user,
					notifications: [],
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

	async purgeUser(id: string): Promise<{ account: boolean }> {
		return await this.#db.transaction(async (tx) => {
			const [user] = await tx
				.delete(tables.users)
				.where(eq(tables.users.id, id))
				.returning();

			return {
				account: Boolean(user),
			};
		});
	}

	/* --- MIRROR RELATED METHODS --- */

	async addMirror(userId: string, url: string): Promise<boolean> {
		// A mirror belongs to one user, so re-adding your own or adding someone else's changes nothing
		const added = await this.#db
			.insert(tables.customDomains)
			.values({ domain: url, userId })
			.onConflictDoNothing({ target: tables.customDomains.domain })
			.returning({ domain: tables.customDomains.domain });
		return added.length > 0;
	}

	async removeMirror(userId: string, url: string): Promise<boolean> {
		const removed = await this.#db
			.delete(tables.customDomains)
			.where(
				and(
					eq(tables.customDomains.domain, url),
					eq(tables.customDomains.userId, userId),
				),
			)
			.returning({ domain: tables.customDomains.domain });
		return removed.length > 0;
	}

	/* --- VERIFICATION RELATED METHODS --- */
	async findVerify(id: string): Promise<PendingMember | undefined> {
		const [pending] = await this.#db
			.select()
			.from(tables.verifyingUsers)
			.where(eq(tables.verifyingUsers.id, id));
		return pending;
	}

	async listVerifies(): Promise<PendingMember[]> {
		return this.#db
			.select()
			.from(tables.verifyingUsers)
			.orderBy(asc(tables.verifyingUsers.createdAt));
	}

	async verifyUser(
		id: string,
		options?: { admin?: boolean },
	): Promise<User | undefined> {
		const verify = await this.findVerify(id);

		if (!verify) return undefined;
		const user = await this.makeUser(
			{
				username: verify.username,
				id: verify.id,
				password: verify.password,
				email: verify.email,
			},
			options,
		);

		if (!user) return undefined;
		await this.#db
			.delete(tables.verifyingUsers)
			.where(eq(tables.verifyingUsers.id, id));

		return user;
	}

	async verifySelf(id: string): Promise<User | undefined> {
		return this.verifyUser(id); // We have this nice code, lets re-use it
	}

	async denyUser(id: string): Promise<boolean> {
		const deletion = await this.#db
			.delete(tables.verifyingUsers)
			.where(eq(tables.verifyingUsers.id, id))
			.returning({ id: tables.verifyingUsers.id });
		return deletion.length === 1;
	}

	async denySelf(id: string): Promise<boolean> {
		return this.denyUser(id);
	}

	async makeVerify(
		userInfo: {
			username: string;
			id: string;
			password: string;
			email: string;
		},
		validationToken: string,
		adminNotification?: Pick<Notification, "id" | "title" | "content">,
	): Promise<PendingMember> {
		// One transaction, so there's never a pending user without the notification an admin needs, or the reverse
		return this.#db.transaction(async (tx) => {
			const [verify] = await tx
				.insert(tables.verifyingUsers)
				.values({
					id: userInfo.id,
					username: normalizeInput(userInfo.username),
					password: userInfo.password,
					email: normalizeInput(userInfo.email),
					validationToken,
				})
				.returning();

			if (adminNotification) {
				// Tied to the pending user, so verifying or denying them deletes it too (ON DELETE CASCADE)
				await tx
					.insert(tables.adminNotifications)
					.values({ ...adminNotification, verifyingUser: verify.id });
			}

			return verify;
		});
	}

	/* --- FILE RELATED METHODS --- */
	async findFile(filter: FileFilter): Promise<Upload | undefined> {
		const [file] = await this.#db
			.select()
			.from(tables.files)
			.where(fileWhere(filter));
		return file;
	}

	async listFiles(owner: string, page: PageOptions): Promise<Upload[]> {
		const { where, orderBy, limit, reverse } = toSQLPage(page);
		const rows = await this.#db.query.files.findMany({
			where: {
				owner,
				...where,
			},
			orderBy,
			limit,
		});

		return reverse ? rows.reverse() : rows;
	}

	async makeFile(
		id: string,
		owner: string,
		fields: { contentType: string; ext: string },
	): Promise<Upload> {
		const [file] = await this.#db
			.insert(tables.files)
			.values({
				id,
				owner,
				contentType: fields.contentType,
				ext: fields.ext,
			})
			.returning();
		return file;
	}

	async purgeFile(filter: FileFilter): Promise<boolean> {
		// TODO: Ensure no file is orphaned without a record
		// ATOMICITY: Check for records without an owner at startup
		// - Check for files without a record at startup
		// - Clear users marked for deletion at startup
		const [file] = await this.#db
			.delete(tables.files)
			.where(fileWhere(filter))
			.returning(); // May want to simply mark as deleted
		if (!file) return false;
		const path = uploadPath(file.id, file.ext);
		try {
			await unlink(path);
		} catch (error: unknown) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				logger.error(
					new Error(`Database could not delete file ${path}`, {
						cause: error,
					}),
				);
			}
		}

		return true; // The record is gone; the file may still be on disk if unlink failed (logged above)
	}

	async purgeFilesByIds(owner: string, ids: string[]): Promise<number> {
		if (ids.length === 0) return 0;
		const files = await this.#db
			.delete(tables.files)
			.where(
				and(
					eq(tables.files.owner, owner),
					inArray(tables.files.id, ids),
				),
			)
			.returning({
				id: tables.files.id,
			});
		return files.length;
	}

	/* --- LINK RELATED METHODS --- */
	async findLink(filter: LinkFilter): Promise<Link | undefined> {
		const [link] = await this.#db
			.select()
			.from(tables.links)
			.where(linkWhere(filter));
		return link;
	}

	async findAndDeleteLink(filter: LinkFilter): Promise<Link | undefined> {
		const [link] = await this.#db
			.delete(tables.links)
			.where(linkWhere(filter))
			.returning();
		return link;
	}

	async listLinks(owner: string, page: PageOptions): Promise<Link[]> {
		const { where, orderBy, reverse, limit } = toSQLPage(page);
		const links = await this.#db.query.links.findMany({
			where: {
				...where,
				owner,
			},
			orderBy,
			limit,
		});

		return reverse ? links.reverse() : links;
	}

	async makeLink(id: string, owner: string, link: string): Promise<Link> {
		const [newLink] = await this.#db
			.insert(tables.links)
			.values({ id, owner, link })
			.returning();
		return newLink;
	}

	async purgeLink(filter: LinkFilter): Promise<boolean> {
		return Boolean(await this.findAndDeleteLink(filter));
	}

	/* --- AUTHENTICATION RELATED METHODS --- */
	async findToken(
		tokenID: string,
		id: string,
		options?: { web?: boolean },
	): Promise<Tokendb | undefined> {
		const [token] = await this.#db
			.select()
			.from(tables.tokens)
			.where(
				and(
					eq(tables.tokens.id, tokenID),
					eq(tables.tokens.userId, id),
					eq(tables.tokens.web, options?.web ?? false),
				),
			);
		return token ? toToken(token) : undefined;
	}

	async findTokens(
		userId: string,
		options?: { web?: boolean },
	): Promise<Tokendb[]> {
		const tokens = await this.#db
			.select()
			.from(tables.tokens)
			.where(
				and(
					eq(tables.tokens.userId, userId),
					eq(tables.tokens.web, options?.web ?? false),
				),
			)
			.orderBy(asc(tables.tokens.createdAt));
		return tokens.map(toToken);
	}

	async makeToken(
		tokenID: string,
		userId: string,
		options?: { web?: boolean; description?: string },
	): Promise<Tokendb | undefined> {
		const date = new Date();
		date.setDate(date.getDate() + TOKEN_EXPIRY_DAYS);
		const [token] = await this.#db
			.insert(tables.tokens)
			.values({
				id: tokenID,
				userId,
				web: options?.web ?? false,
				expiresAt: options?.web ? date : undefined,
				description: options?.description,
			})
			.returning();

		return toToken(token);
	}

	async purgeToken(
		tokenID: string,
		userID: string,
		options?: { web?: boolean },
	): Promise<boolean> {
		const tokens = await this.#db
			.delete(tables.tokens)
			.where(
				and(
					eq(tables.tokens.id, tokenID),
					eq(tables.tokens.userId, userID),
					options?.web !== undefined
						? eq(tables.tokens.web, options.web)
						: undefined,
				),
			)
			.returning();
		return tokens.length === 1;
	}

	async purgeTokens(
		userID: string,
		web?: boolean,
	): Promise<number | undefined> {
		const tokens = await this.#db
			.delete(tables.tokens)
			.where(
				and(
					eq(tables.tokens.userId, userID),
					web ? eq(tables.tokens.web, web) : undefined,
				),
			)
			.returning();

		return tokens.length;
	}

	async purgeExpiredTokens(): Promise<number> {
		const tokens = await this.#db
			.delete(tables.tokens)
			.where(lt(tables.tokens.expiresAt, new Date()))
			.returning({ id: tables.tokens.id });
		return tokens.length;
	}

	/* --- ADMIN RELATED METHODS --- */
	async makeAdminNotify(
		id: string,
		content: string,
		title: string,
	): Promise<Notification> {
		const [notification] = await this.#db
			.insert(tables.adminNotifications)
			.values({ id, content, title })
			.returning();
		return notification;
	}

	async findAdminNotify(id: string): Promise<Notification | undefined> {
		const [notification] = await this.#db
			.select()
			.from(tables.adminNotifications)
			.where(eq(tables.adminNotifications.id, id));
		return notification;
	}

	async listAdminNotifies(): Promise<Notification[]> {
		const notifications = await this.#db
			.select()
			.from(tables.adminNotifications)
			.orderBy(desc(tables.adminNotifications.createdAt));
		return notifications;
	}

	async purgeAdminNotify(id: string): Promise<boolean> {
		const notification = await this.#db
			.delete(tables.adminNotifications)
			.where(eq(tables.adminNotifications.id, id))
			.returning();
		return notification.length === 1;
	}

	/* --- DATABASE RELATED METHODS --- */
	async shutdown(): Promise<void> {
		return this.#client?.close(); // Closes the client. Should be done after http server end
	}
}
