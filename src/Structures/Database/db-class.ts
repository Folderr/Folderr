/* eslint max-params: ["error", 6] */
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

/* eslint-disable @typescript-eslint/no-unused-vars */

export interface Folderr {
	bans: string[];
	publicKeyJWT: Buffer;
}

export interface Notification {
	id: string;
	title: string;
	notify: string;
	created: Date;
}

export interface User {
	username: string;
	id: string;
	password: string;
	owner?: boolean;
	admin?: boolean;
	notifs: Notification[];
	cURLs: string[];
	files: number;
	links: number;
	email: string;
	created: Date;
	pendingEmail?: string;
	pendingEmailToken?: string;
}

export interface Link {
	link: string;
	owner: string;
	id: string;
	created: Date;
}

export interface PendingMember {
	id: string;
	password: string;
	username: string;
	validationToken: string;
	email: string;
	created: Date;
}

export interface TokenDB {
	id: string;
	userID: string;
	web?: boolean;
	created: Date;
}

export interface Upload {
	id: string;
	owner: string;
	format: string;
	path: string;
	type: string;
	created: Date;
}

/**
 * @classdesc Base class for all Database handlers to extend
 */
export class DBClass {
	constructor() {
		if (this.constructor.name === 'DBClass') {
			throw new Error('DBClass is abstract! You may not use it directly!');
		}
	}

	async init(url: string): Promise<any> {
		throw new Error('DB > NOT IMPLEMENTED - Method init is not implemented!');
	}

	async createFolderr(publicKeyJWT: Buffer): Promise<Folderr> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method createFolderr is not implemented!'
		);
	}

	async addFolderrBan(email: string): Promise<boolean | void> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method addFolderrBan is not implemented!'
		);
	}

	async fetchFolderr(query?: Record<string, unknown>): Promise<Folderr> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method fetchFolderr is not implemented!'
		);
	}

	async removeFolderrBan(email: string): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method removeFolderrBan is not implemented!'
		);
	}

	async makeOwner(
		username: string,
		password: string,
		id: string,
		email: string
	): Promise<User | void> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method makeOwner is not implemented!'
		);
	}

	async findUser(
		query: Record<string, unknown>,
		selector?: string
	): Promise<User | null | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findUser is not implemented!'
		);
	}

	async findUsers(
		query: Record<string, unknown>,
		options?: {
			sort?: Record<string, unknown>;
			limit?: number;
			selector?: string;
		}
	): Promise<User[] | any[]> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findUsers is not implemented!'
		);
	}

	async findFullUser(
		query: Array<Record<string, unknown>>,
		selectors?: {
			user?: string;
			file?: string;
			link?: string;
		}
	): Promise<{account: User; files: Upload[]; links: Link[]} | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findFullUser is not implemented!'
		);
	}

	async findAndUpdateUser(
		query: Record<string, unknown>,
		update: Record<string, unknown>,
		selector?: string
	): Promise<User | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findAndUpdateUser is not implemented!'
		);
	}

	async updateUser(
		query: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method updateUser is not implemented!'
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
		}
	): Promise<User | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method makeUser is not implemented!'
		);
	}

	async purgeUser(
		id: string
	): Promise<{account: boolean; links: boolean} | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method purgeUser is not implemented!'
		);
	}

	async findVerify(
		query: Record<string, unknown>
	): Promise<PendingMember | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findVerify is not implemented!'
		);
	}

	async findVerifies(query: Record<string, unknown>): Promise<PendingMember[]> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findVerifies is not implemented!'
		);
	}

	async verifyUser(
		id: string,
		options?: {admin: boolean}
	): Promise<User | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method verifyUser is not implemented!'
		);
	}

	async verifySelf(id: string): Promise<User | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method verifySelf is not implemented!'
		);
	}

	async denyUser(id: string): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method denyUser is not implemented!'
		);
	}

	async denySelf(id: string): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method verifySelf is not implemented!'
		);
	}

	async makeVerify(
		userInfo: {
			username: string;
			id: string;
			password: string;
			email: string;
		},
		validationToken: string
	): Promise<PendingMember> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method makeVerify is not implemented!'
		);
	}

	async findFile(
		query: Record<string, unknown>,
		selector?: string
	): Promise<Upload | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findFile is not implemented!'
		);
	}

	async findAndDeleteFile(
		query: Record<string, unknown>
	): Promise<Upload | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findAndDeleteFile is not implemented!'
		);
	}

	async findFiles(
		query: Record<string, unknown>,
		options?: {
			limit?: number;
			selector?: string;
			sort?: Record<string, unknown>;
		}
	): Promise<Upload[]> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findFiles is not implemented!'
		);
	}

	async updateFile(
		query: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method updateFile is not implemented!'
		);
	}

	async makeFile(
		id: string,
		owner: string,
		path: string,
		type: string
	): Promise<Upload> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method makeFile is not implemented!'
		);
	}

	async purgeFile(query: Record<string, unknown>): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method purgeFile is not implemented!'
		);
	}

	async findLink(
		query: Record<string, unknown>,
		selector?: string
	): Promise<Link | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findLink is not implemented!'
		);
	}

	async findLinks(
		query: Record<string, unknown>,
		options?: {
			limit?: number;
			selector?: string;
			sort?: Record<string, unknown>;
		}
	): Promise<Link[]> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findLinks is not implemented!'
		);
	}

	async findAndDeleteLink(
		query: Record<string, unknown>
	): Promise<Link | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findAndDeleteLink is not implemented!'
		);
	}

	async updateLink(
		query: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method updateLink is not implemented!'
		);
	}

	async makeLink(
		id: string,
		owner: string,
		link: string
	): Promise<Link | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method makeFile is not implemented!'
		);
	}

	async purgeLink(query: Record<string, unknown>): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method purgeLink is not implemented!'
		);
	}

	async findToken(
		tokenID: string,
		id: string,
		options?: {
			web?: boolean;
		}
	): Promise<TokenDB | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findToken is not implemented!'
		);
	}

	async findTokens(id: string, options?: {web: boolean}): Promise<TokenDB[]> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findTokens is not implemented!'
		);
	}

	async makeToken(
		tokenID: string,
		userID: string,
		options?: {
			web?: boolean;
		}
	): Promise<TokenDB | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method addToken is not implemented!'
		);
	}

	async purgeToken(
		tokenID: string,
		userID: string,
		options?: {web?: boolean}
	): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method addTokens is not implemented!'
		);
	}

	async purgeTokens(
		userID: string,
		web?: boolean
	): Promise<number | undefined> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method purgeTokens is not implemented!'
		);
	}

	async makeAdminNotify(
		id: string,
		notify: string,
		title: string
	): Promise<Notification> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method makeAdminNotify is not implemented!'
		);
	}

	async findAdminNotify(
		query: Record<string, unknown>
	): Promise<Notification | undefined | null> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findAdminNotify is not implemented!'
		);
	}

	async findAdminNotifies(
		query: Record<string, unknown>
	): Promise<Notification[]> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method findAdminNotifies is not implemented!'
		);
	}

	async purgeAdminNotify(query: Record<string, unknown>): Promise<boolean> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method purgeAdminNotify is not implemented!'
		);
	}

	async shutdown(): Promise<void> {
		throw new Error(
			'DB > NOT IMPLEMENTED - Method purgeAdminNotify is not implemented!'
		);
	}
}

/* eslint-enable @typescript-eslint/no-unused-vars */

export default DBClass;
