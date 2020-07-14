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

export interface Folderr {
    bans: string[];
}

export interface Notification {
    ID: string;
    title: string;
    notify: string;
    created: Date;
}

export interface User {
    username: string;
    userID: string;
    password: string;
    first?: boolean;
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
    ID: string;
    created: Date;
}

export interface PendingMember {
    userID: string;
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
    ID: string;
    owner: string;
    format: string;
    path: string;
    type: string;
    created: Date;
}

/**
 * @classdesc Base class for all Database handlers to extend, used to maintain consistency across the database(s)
 */
export class DBClass {
    constructor() {
        if (this.constructor.name === 'DBClass') {
            throw Error('DBClass is abstract! You may not use it directly!');
        }
    }

    async init(...args: any[] ): Promise<any> {
        throw new Error('DB > NOT IMPLEMENTED - Method init is not implemented!');
    }

    async createFolderr(): Promise<Folderr> {
        throw new Error('DB > NOT IMPLEMENTED - Method createFolderr is not implemented!');
    }

    async addFolderrBan(email: string): Promise<boolean | void> {
        throw new Error('DB > NOT IMPLEMENTED - Method addFolderrBan is not implemented!');
    }

    async fetchFolderr(query: object): Promise<Folderr> {
        throw new Error('DB > NOT IMPLEMENTED - Method fetchFolderr is not implemented!');
    }

    async removeFolderrBan(email: string): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method removeFolderrBan is not implemented!');
    }

    async makeOwner(username: string, password: string, userID: string, email: string): Promise<User | void> {
        throw new Error('DB > NOT IMPLEMENTED - Method makeOwner is not implemented!');
    }

    async findUser(query: object, selector?: string): Promise<User | null | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method findUser is not implemented!');
    }

    async findUsers(query: object, options?: { sort?: object; limit?: number; selector?: string } ): Promise<User[] | []> {
        throw new Error('DB > NOT IMPLEMENTED - Method findUsers is not implemented!');
    }

    async findFullUser(query: object, selectors?: { user?: string; file?: string; link?: string } ): Promise<{ account: User; files: Upload[]; links: Link[] } | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method findFullUser is not implemented!');
    }

    async findAndUpdateUser(query: object, update: object, selector?: string): Promise<User | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findAndUpdateUser is not implemented!');
    }

    async updateUser(query: object, update: object): Promise<boolean | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method updateUser is not implemented!');
    }

    async makeUser(username: string, userID: string, password: string, email: string, options?: { admin?: boolean } ): Promise<User | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method makeUser is not implemented!');
    }

    async purgeUser(userID: string): Promise<{ account: boolean; links: boolean } | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeUser is not implemented!');
    }

    async findVerify(query: object): Promise<PendingMember | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findVerify is not implemented!');
    }

    async findVerifies(query: object): Promise<PendingMember[]> {
        throw new Error('DB > NOT IMPLEMENTED - Method findVerifies is not implemented!');
    }

    async verifyUser(userID: string, options?: { admin: boolean } ): Promise<User | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method verifyUser is not implemented!');
    }

    async verifySelf(userID: string): Promise<User | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method verifySelf is not implemented!');
    }

    async denyUser(userID: string): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method denyUser is not implemented!');
    }

    async denySelf(userID: string): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method verifySelf is not implemented!');
    }

    async makeVerify(userID: string, username: string, password: string, validationToken: string, email: string): Promise<PendingMember> {
        throw new Error('DB > NOT IMPLEMENTED - Method makeVerify is not implemented!');
    }

    async findFile(query: object, selector?: string): Promise<Upload | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findFile is not implemented!');
    }

    async findAndDeleteFile(query: object): Promise<Upload | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findAndDeleteFile is not implemented!');
    }


    async findFiles(query: object, options?: { limit?: number; selector?: string; sort?: object } ): Promise<Upload[]> {
        throw new Error('DB > NOT IMPLEMENTED - Method findFiles is not implemented!');
    }

    async updateFile(query: object, update: object): Promise<boolean | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method updateFile is not implemented!');
    }

    async makeFile(id: string, owner: string, path: string, type: string): Promise<Upload> {
        throw new Error('DB > NOT IMPLEMENTED - Method makeFile is not implemented!');
    }

    async purgeFile(query: object): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeFile is not implemented!');
    }

    async findLink(query: object, selector?: string): Promise<Link | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findLink is not implemented!');
    }

    async findLinks(query: object, options?: { limit?: number; selector?: string; sort?: object } ): Promise<Link[]> {
        throw new Error('DB > NOT IMPLEMENTED - Method findLinks is not implemented!');
    }

    async findAndDeleteLink(query: object): Promise<Link | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findAndDeleteLink is not implemented!');
    }

    async updateLink(query: object, update: object): Promise<boolean | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method updateLink is not implemented!');
    }

    async makeLink(id: string, owner: string, link: string): Promise<Link | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method makeFile is not implemented!');
    }

    async purgeLink(query: object): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeLink is not implemented!');
    }

    async findToken(tokenID: string, userID: string, options?: { web?: boolean } ): Promise<TokenDB | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findToken is not implemented!');
    }

    async findTokens(userID: string, options?: { web: boolean } ): Promise<TokenDB[]> {
        throw new Error('DB > NOT IMPLEMENTED - Method findTokens is not implemented!');
    }

    async makeToken(tokenID: string, userID: string, options?: { web?: boolean } ): Promise<TokenDB | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method addToken is not implemented!');
    }

    async purgeToken(tokenID: string, userID: string, options?: { web?: boolean } ): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method addTokens is not implemented!');
    }

    async purgeTokens(userID: string, web?: boolean): Promise<number | undefined> {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeTokens is not implemented!');
    }

    async makeAdminNotify(id: string, notify: string, title: string): Promise<Notification> {
        throw new Error('DB > NOT IMPLEMENTED - Method makeAdminNotify is not implemented!');
    }

    async findAdminNotify(query: object): Promise<Notification | undefined | null> {
        throw new Error('DB > NOT IMPLEMENTED - Method findAdminNotify is not implemented!');
    }

    async findAdminNotifies(query: object): Promise<Notification[]> {
        throw new Error('DB > NOT IMPLEMENTED - Method findAdminNotifies is not implemented!');
    }

    async purgeAdminNotify(query: object): Promise<boolean> {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeAdminNotify is not implemented!');
    }
}

export default DBClass;
