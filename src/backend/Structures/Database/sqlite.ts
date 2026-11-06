import { type Client, createClient, LibsqlError } from "@libsql/client";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { join } from "path";
import process from "process";
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
}
