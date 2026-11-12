CREATE TABLE `admin_notifications` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`verifyingUser` text,
	CONSTRAINT `fk_admin_notifications_verifyingUser_verifying_users_id_fk` FOREIGN KEY (`verifyingUser`) REFERENCES `verifying_users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `bans` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`reason` text NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT "ban_email_normalized" CHECK("email" = lower("email"))
);
--> statement-breakpoint
CREATE TABLE `custom_domains` (
	`domain` text PRIMARY KEY,
	`owner` text NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT `fk_custom_domains_owner_users_id_fk` FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `email_changes` (
	`userId` text PRIMARY KEY,
	`pendingEmail` text NOT NULL UNIQUE,
	`pendingEmailToken` text NOT NULL UNIQUE,
	`tokenExpiresAt` integer NOT NULL,
	CONSTRAINT `fk_email_changes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT "pending_email_normalized" CHECK("pendingEmail" = lower("pendingEmail"))
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY,
	`owner` text NOT NULL,
	`createdAt` integer NOT NULL,
	`contentType` text NOT NULL,
	`ext` text NOT NULL,
	CONSTRAINT `fk_files_owner_users_id_fk` FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `folderr` (
	`publicKeyJWT` blob NOT NULL,
	`createdAt` integer NOT NULL,
	`id` integer PRIMARY KEY DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `links` (
	`link` text NOT NULL,
	`owner` text NOT NULL,
	`id` text PRIMARY KEY,
	`createdAt` integer NOT NULL,
	CONSTRAINT `fk_links_owner_users_id_fk` FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`web` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`expiresAt` integer,
	`description` text DEFAULT 'No description',
	CONSTRAINT `fk_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`userId` text NOT NULL,
	CONSTRAINT `fk_user_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_privacy_choices` (
	`user` text PRIMARY KEY,
	`dataCollection` integer DEFAULT false NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_user_privacy_choices_user_users_id_fk` FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`password` text NOT NULL,
	`username` text NOT NULL UNIQUE,
	`role` text DEFAULT 'user' NOT NULL,
	`email` text NOT NULL UNIQUE,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`markedForDeletion` integer DEFAULT false NOT NULL,
	CONSTRAINT "users_email_normalized" CHECK("email" = lower("email"))
);
--> statement-breakpoint
CREATE TABLE `verifying_users` (
	`id` text PRIMARY KEY,
	`username` text NOT NULL UNIQUE,
	`password` text NOT NULL,
	`validationToken` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`createdAt` integer NOT NULL,
	CONSTRAINT "verifying_user_email_normalized" CHECK("email" = lower("email"))
);
--> statement-breakpoint
CREATE INDEX `admin_notifications_paging_idx` ON `admin_notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `custom_domain_owner_idx` ON `custom_domains` (`owner`);--> statement-breakpoint
CREATE INDEX `files_paging_idx` ON `files` (`owner`,`createdAt`);--> statement-breakpoint
CREATE INDEX `links_paging_idx` ON `links` (`owner`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tokens_user_idx` ON `tokens` (`userId`);--> statement-breakpoint
CREATE INDEX `tokens_expiration` ON `tokens` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `user_notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `users_paging_idx` ON `users` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_owner_unique_idx` ON `users` (`role`) WHERE "users"."role" = 'owner';