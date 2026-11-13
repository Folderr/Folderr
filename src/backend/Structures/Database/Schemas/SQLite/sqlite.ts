import { defineRelations, sql } from "drizzle-orm";
import {
	blob,
	check,
	index,
	int,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export type UserRole = "user" | "admin" | "owner";

// The database is kept mostly lean so most values aren't nullable

// Emails are stored lowercased (normalizeInput). These checks reject anything that isn't,
// even from writers outside the engine, so a plain unique index is enough to stop duplicates.
// SQLite's lower() only lowercases ASCII, so non-ASCII capitals slip past here.

export const users = sqliteTable(
	"users",
	{
		id: text().primaryKey(),
		password: text().notNull(),
		username: text().notNull().unique(),
		role: text().$type<UserRole>().default("user").notNull(),
		email: text().notNull().unique(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		markedForDeletion: int({ mode: "boolean" }).default(false).notNull(),
	},
	(table) => [
		check(
			"users_email_normalized",
			sql`${table.email} = lower(${table.email})`,
		),
		index("users_paging_idx").on(table.createdAt), // listUsers pages by creation time
		uniqueIndex("users_owner_unique_idx")
			.on(table.role)
			.where(sql`${table.role} = 'owner'`),
	],
);

export const emailChanges = sqliteTable(
	"email_changes",
	{
		userId: text()
			.primaryKey()
			.references(() => users.id, { onDelete: "cascade" }),
		pendingEmail: text().unique().notNull(),
		pendingEmailToken: text().unique().notNull(),
		tokenExpiresAt: int({ mode: "timestamp_ms" }).notNull(), // You only get a certain amount of time to accept
	},
	(table) => [
		check(
			"pending_email_normalized",
			sql`${table.pendingEmail} = lower(${table.pendingEmail})`,
		),
	],
);

export const userPrivacyChoices = sqliteTable("user_privacy_choices", {
	userId: text()
		.primaryKey()
		.references(() => users.id, { onDelete: "cascade" }),
	dataCollection: int({ mode: "boolean" }).default(false).notNull(),
	updatedAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

export const userNotifications = sqliteTable(
	"user_notifications",
	{
		id: text().primaryKey(),
		title: text().notNull(),
		content: text().notNull(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("notification_user_idx").on(table.userId, table.createdAt),
	],
);

export const adminNotifications = sqliteTable(
	"admin_notifications",
	{
		id: text().primaryKey(),
		title: text().notNull(),
		content: text().notNull(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		verifyingUser: text().references(() => verifyingUsers.id, {
			onDelete: "cascade",
		}),
	},
	(table) => [index("admin_notifications_paging_idx").on(table.createdAt)],
); // This should sort from newest first (DESC)

export const customDomains = sqliteTable(
	"custom_domains",
	{
		domain: text().primaryKey(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("custom_domain_user_idx").on(table.userId)],
);

export const links = sqliteTable(
	"links",
	{
		link: text().notNull(), // The "to" link
		owner: text()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }), // Alternatively, no action if we wish to keep a users links
		id: text().primaryKey(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("links_paging_idx").on(table.owner, table.createdAt)],
);

export const files = sqliteTable(
	"files",
	{
		id: text().primaryKey(),
		owner: text()
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		contentType: text().notNull(), // The type of content
		ext: text().notNull(), // Content extension
	},
	(table) => [index("files_paging_idx").on(table.owner, table.createdAt)],
);

export const tokens = sqliteTable(
	"tokens",
	{
		id: text().primaryKey(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		web: int({ mode: "boolean" }).default(false).notNull(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		expiresAt: int({ mode: "timestamp_ms" }),
		description: text().default("No description"),
	},
	(table) => [
		index("tokens_user_idx").on(table.userId),
		index("tokens_expiration").on(table.expiresAt),
	],
);

export const verifyingUsers = sqliteTable(
	"verifying_users",
	{
		id: text().primaryKey(),
		username: text().unique().notNull(),
		password: text().notNull(),
		validationToken: text().notNull(),
		email: text().notNull().unique(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		check(
			"verifying_user_email_normalized",
			sql`${table.email} = lower(${table.email})`,
		),
	],
);

export const bans = sqliteTable(
	"bans",
	{
		id: text().primaryKey(),
		email: text().notNull().unique(),
		reason: text().notNull(),
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		check(
			"ban_email_normalized",
			sql`${table.email} = lower(${table.email})`,
		),
	],
);

export const folderr = sqliteTable("folderr", {
	publicKeyJWT: blob({ mode: "buffer" }).notNull(),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	id: int().primaryKey().default(1),
});

export const relations = defineRelations(
	{
		users,
		userNotifications,
		verifyingUsers,
		tokens,
		links,
		files,
		customDomains,
		emailChanges,
		userPrivacyChoices,
	},
	(r) => ({
		users: {
			notifications: r.many.userNotifications({
				from: r.users.id,
				to: r.userNotifications.userId,
			}),
			privacy: r.one.userPrivacyChoices({
				optional: false,
				from: r.users.id,
				to: r.userPrivacyChoices.userId,
			}),
			pendingEmailChange: r.one.emailChanges({
				optional: true,
				from: r.users.id,
				to: r.emailChanges.userId,
			}),
			cURLs: r.many.customDomains({
				from: r.users.id,
				to: r.customDomains.userId,
			}),
		},
	}),
);
