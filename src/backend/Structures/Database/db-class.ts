/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import type { Config } from "../../handlers/config-handler.js";

export interface Folderr {
	publicKeyJWT: Buffer;
}

export interface Notification {
	id: string;
	title: string;
	content: string;
	createdAt: Date;
}

export interface User {
	username: string;
	id: string;
	password: string;
	owner?: boolean;
	admin?: boolean;
	notifications: Notification[];
	cURLs: string[];
	email: string;
	createdAt: Date;
	pendingEmail?: string;
	pendingEmailToken?: string;
	tokenExpiresAt?: Date;
	privacy?: {
		dataCollection?: boolean;
	};
	markedForDeletion?: boolean;
}

/** How many uploads and short links a user has. Counted when asked for, never stored */
export interface ContentCounts {
	files: number;
	links: number;
}

/** A user with their content counts, as the admin user list shows them */
export type UserWithCounts = User & ContentCounts;

export interface Ban {
	email: string;
	createdAt: Date;
	id: string;
	reason: string;
}

export interface Link {
	link: string;
	owner: string;
	id: string;
	createdAt: Date;
}

export interface PendingMember {
	id: string;
	password: string;
	username: string;
	validationToken: string;
	email: string;
	createdAt: Date;
}

export interface Tokendb {
	id: string;
	userID: string;
	web?: boolean;
	createdAt: Date;
	expireAt?: Date;
	description?: string;
}

export interface Statistics {
	users: number;
	files: number;
	links: number;
	bannedEmails: number;
	whitelistedEmails: number;
}

export interface Upload {
	id: string;
	owner: string;
	createdAt: Date;
	/** What the file really is, worked out at upload */
	contentType: string;
	/** The extension it's stored and linked under; empty when it has none */
	ext: string;
}

/**
 * The ways a user can be looked up. Emails match without regard to letter case.
 * markedForDeletion narrows any of them, e.g. sign-in skips accounts being deleted
 */
export type UserFilter = (
	| { id: string }
	| { username: string }
	| { email: string }
	| { owner: true }
) & { markedForDeletion?: boolean };

/**
 * One page of a list, by creation time. Newest first unless ascending.
 * before and after are exclusive; with only after, the page is the items just after it
 */
export interface PageOptions {
	before?: Date;
	after?: Date;
	limit: number;
	ascending?: boolean;
}

/** An upload is always found by its ID; owner and ext narrow it, e.g. to a user's own file */
export type FileFilter = { id: string; owner?: string; ext?: string };

/** A short link is always found by its ID; owner narrows it to a user's own link */
export type LinkFilter = { id: string; owner?: string };

export class DatabaseError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "DatabaseError";
	}
}

export class FolderrNotSetupError extends DatabaseError {
	constructor() {
		super("Folderr DB entry not found, Folderr DB entry is required.");
		this.name = "FolderrNotSetupError";
	}
}

export class DBConflictError extends DatabaseError {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "DBConflictError";
	}
}

export function normalizeInput(input: string): string {
	return input.trim().toLowerCase();
}

/**
 * @classdesc Base class for all Database handlers to extend
 */
export class DBClass {
	public status!: string;
	constructor() {
		if (this.constructor.name === "DBClass") {
			throw new Error(
				"DBClass is abstract! You may not use it directly!",
			);
		}
	}

	async init(config: Config["db"]): Promise<void> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method init is not implemented!",
		);
	}

	/* ---- FOLDERR RELATED METHODS ---- */
	async createFolderr(publicKeyJWT: Buffer): Promise<Folderr> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method createFolderr is not implemented!",
		);
	}

	async getBans(): Promise<Ban[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method getBans is not implemented!",
		);
	}

	async addBan(email: string, id: string, reason: string): Promise<Ban> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method addBan is not implemented!",
		);
	}

	/**
	 * @desc The instance's settings. There's only ever one
	 */
	async fetchFolderr(): Promise<Folderr> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method fetchFolderr is not implemented!",
		);
	}

	/**
	 * @desc Lifts the ban on an email, ignoring letter case
	 */
	async removeBan(email: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method removeBan is not implemented!",
		);
	}

	/**
	 * @desc Whether an email is banned, ignoring letter case
	 */
	async isBanned(email: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method isBanned is not implemented!",
		);
	}

	async makeOwner(
		username: string,
		password: string,
		id: string,
		email: string,
	): Promise<User | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeOwner is not implemented!",
		);
	}

	async statistics(): Promise<Statistics> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method statistics is not implemented!",
		);
	}

	/* ---- USER RELATED METHODS ---- */

	async findUser(filter: UserFilter): Promise<User | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findUser is not implemented!",
		);
	}

	/**
	 * @desc Whether an account or a pending signup has this username
	 */
	async isUsernameTaken(username: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method isUsernameTaken is not implemented!",
		);
	}

	/**
	 * @desc Whether an account, an account's pending email change, or a pending signup
	 * has this email, ignoring letter case
	 */
	async isEmailTaken(email: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method isEmailTaken is not implemented!",
		);
	}

	/**
	 * @desc One page of accounts by creation time, with each one's content counts
	 */
	async listUsers(page: PageOptions): Promise<UserWithCounts[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method listUsers is not implemented!",
		);
	}

	/**
	 * @desc How many uploads and short links a user has. Kept out of findUser, which runs on
	 * every authenticated request, so only the routes that show these pay for counting them
	 */
	async countContent(userId: string): Promise<ContentCounts> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method countContent is not implemented!",
		);
	}

	/**
	 * @desc Makes a user an admin or takes it away. The owner is never changed
	 * @returns The updated user, or undefined if there was nothing to change
	 */
	async setAdmin(id: string, admin: boolean): Promise<User | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method setAdmin is not implemented!",
		);
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
	): Promise<boolean | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method updateUser is not implemented!",
		);
	}

	async addNotification(
		userID: string,
		notification: Pick<Notification, "id" | "title" | "content">,
	): Promise<boolean | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method addNotification is not implemented!",
		);
	}

	async removeNotification(
		userID: string,
		id: string,
	): Promise<boolean | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method removeNotification is not implemented!",
		);
	}

	async clearNotifications(userID: string): Promise<boolean | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method clearNotifications is not implemented!",
		);
	}

	async makeUser(
		userInfo: {
			username: string;
			id: string;
			password: string;
			email: string;
		},
		options?: {
			admin?: boolean;
		},
	): Promise<User | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeUser is not implemented!",
		);
	}

	async markUserForDeletion(id: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method markUserForDeletion is not implemented!",
		);
	}

	async purgeUser(id: string): Promise<{ account: boolean } | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeUser is not implemented!",
		);
	}

	addMirror(userID: string, url: string): Promise<boolean | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method addMirror is not implemented!",
		);
	}

	removeMirror(userID: string, url: string): Promise<boolean | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method removeMirror is not implemented!",
		);
	}

	async findVerify(id: string): Promise<PendingMember | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findVerify is not implemented!",
		);
	}

	/**
	 * @desc Every pending signup, oldest first
	 */
	async listVerifies(): Promise<PendingMember[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method listVerifies is not implemented!",
		);
	}

	async verifyUser(
		id: string,
		options?: { admin: boolean },
	): Promise<User | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method verifyUser is not implemented!",
		);
	}

	async verifySelf(id: string): Promise<User | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method verifySelf is not implemented!",
		);
	}

	async denyUser(id: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method denyUser is not implemented!",
		);
	}

	async denySelf(id: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method verifySelf is not implemented!",
		);
	}

	/**
	 * @desc Adds a user pending verification. Pass `adminNotification` when an admin has to approve
	 * the signup: it's saved with the pending user, and goes away when they're verified or denied
	 */
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
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeVerify is not implemented!",
		);
	}

	/* ---- FILE RELATED METHODS ---- */

	async findFile(filter: FileFilter): Promise<Upload | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findFile is not implemented!",
		);
	}

	/**
	 * @desc One page of a user's uploads by upload time
	 */
	async listFiles(owner: string, page: PageOptions): Promise<Upload[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method listFiles is not implemented!",
		);
	}

	async makeFile(
		id: string,
		owner: string,
		fields: { contentType: string; ext: string },
	): Promise<Upload> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeFile is not implemented!",
		);
	}

	/**
	 * Deletes a file from the database and the disk.
	 * If deleting files en masse, use db.purgeFilesByIds
	 * @param filter What file to remove
	 * @returns Whether or not the file was deleted
	 */
	async purgeFile(filter: FileFilter): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeFile is not implemented!",
		);
	}

	/**
	 * Deletes the records of these uploads, but only the ones that belong to owner.
	 * The files on disk are the caller's job (see the deletion queue)
	 * @returns How many records were deleted
	 */
	async purgeFilesByIds(owner: string, ids: string[]): Promise<number> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeFilesByIds is not implemented!",
		);
	}

	/* ---- LINK (shortened URLs) RELATED METHODS ---- */
	async findLink(filter: LinkFilter): Promise<Link | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findLink is not implemented!",
		);
	}

	/**
	 * @desc One page of a user's short links by creation time
	 */
	async listLinks(owner: string, page: PageOptions): Promise<Link[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method listLinks is not implemented!",
		);
	}

	async findAndDeleteLink(filter: LinkFilter): Promise<Link | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findAndDeleteLink is not implemented!",
		);
	}

	async makeLink(
		id: string,
		owner: string,
		link: string,
	): Promise<Link | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeFile is not implemented!",
		);
	}

	async purgeLink(filter: LinkFilter): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeLink is not implemented!",
		);
	}

	/* ---- AUTHENTICATION RELATED METHODS ---- */
	async findToken(
		tokenID: string,
		id: string,
		options?: {
			web?: boolean;
		},
	): Promise<Tokendb | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findToken is not implemented!",
		);
	}

	async findTokens(
		id: string,
		options?: { web: boolean },
	): Promise<Tokendb[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findTokens is not implemented!",
		);
	}

	async makeToken(
		tokenID: string,
		userID: string,
		options?: {
			web?: boolean;
			description?: string;
		},
	): Promise<Tokendb | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeToken is not implemented!",
		);
	}

	async purgeToken(
		tokenID: string,
		userID: string,
		options?: { web?: boolean },
	): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method addTokens is not implemented!",
		);
	}

	async purgeTokens(
		userID: string,
		web?: boolean,
	): Promise<number | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeTokens is not implemented!",
		);
	}

	async purgeExpiredTokens(): Promise<number> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeExpiredTokens is not implemented!",
		);
	}

	/* ---- ADMIN RELATED METHODS ---- */
	async makeAdminNotify(
		id: string,
		content: string,
		title: string,
	): Promise<Notification> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method makeAdminNotify is not implemented!",
		);
	}

	async findAdminNotify(id: string): Promise<Notification | undefined> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method findAdminNotify is not implemented!",
		);
	}

	/**
	 * @desc Every admin notification, newest first
	 */
	async listAdminNotifies(): Promise<Notification[]> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method listAdminNotifies is not implemented!",
		);
	}

	async purgeAdminNotify(id: string): Promise<boolean> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeAdminNotify is not implemented!",
		);
	}

	/* ---- DB RELATED METHODS ---- */

	/**
	 * @description Shuts down the database
	 */
	async shutdown(): Promise<void> {
		throw new Error(
			"DB > NOT IMPLEMENTED - Method purgeAdminNotify is not implemented!",
		);
	}
}

export default DBClass;
