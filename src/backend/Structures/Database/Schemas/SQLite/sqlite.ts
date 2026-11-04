import { sql } from "drizzle-orm";
import {
	blob,
	int,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export type UserRole = "user" | "admin" | "owner";

export const users = sqliteTable(
	"users",
	{
		id: text().primaryKey(),
		password: text().notNull(),
		username: text().notNull().unique(),
		role: text().$type<UserRole>().default("user").notNull(),
		files: int().default(0), // Statistic, may be redundant in sql
		links: int().default(0), // Same as above
		email: text().notNull().unique(),
		pendingEmail: text().unique(),
		pendingEmailToken: text().unique(),
		tokenExpiresAt: int({ mode: "timestamp_ms" }), // Timestamp
		createdAt: int({ mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		markedForDeletion: int({ mode: "boolean" }).default(false),
	},
	(table) => [uniqueIndex("users_email_idx").on(sql`lower(${table.email})`)],
);

export const userPrivacyChoices = sqliteTable("user_privacy_choices", {
	user: text()
		.primaryKey()
		.references(() => users.id),
	dataCollection: int({ mode: "boolean" }).default(false),
	updatedAt: int({ mode: "timestamp_ms" }).notNull(),
});

export const userNotifications = sqliteTable("user_notifications", {
	id: text().primaryKey(),
	title: text().notNull(),
	notification: text().notNull(),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	userId: text()
		.notNull()
		.references(() => users.id),
});

export const adminNotifications = sqliteTable("admin_notifications", {
	id: text().primaryKey(),
	title: text().notNull(),
	notify: text().notNull(),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const customDomains = sqliteTable("custom_domains", {
	domain: text().primaryKey(),
	owner: text()
		.notNull()
		.references(() => users.id),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const links = sqliteTable("links", {
	link: text().notNull(), // The "to" link
	owner: text()
		.notNull()
		.references(() => users.id),
	id: text().primaryKey(),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const files = sqliteTable("files", {
	id: text().primaryKey(),
	owner: text()
		.notNull()
		.references(() => users.id),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	contentType: text().notNull(), // The type of content
	ext: text().notNull(), // Content extension
});

export const tokens = sqliteTable("tokens", {
	id: text().primaryKey(),
	userId: text()
		.notNull()
		.references(() => users.id),
	web: int({ mode: "boolean" }),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	expiresAt: int({ mode: "timestamp_ms" }),
	description: text().default("No description"),
});

export const verifyingUsersTable = sqliteTable("verifying_users", {
	id: text().primaryKey(),
	username: text().unique().notNull(),
	password: text().notNull(),
	validationToken: text().notNull(),
	email: text().notNull().unique(), // Not an index
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

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
	(table) => [uniqueIndex("email_bans_idx").on(sql`lower(${table.email})`)],
);

export const folderr = sqliteTable("folderr", {
	publicKeyJWT: blob({ mode: "buffer" }).notNull(),
	createdAt: int({ mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	id: int().primaryKey().default(1),
});
