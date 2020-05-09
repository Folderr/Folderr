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

import Path from '../../Structures/Path';
import Folderr from '../../Structures/Folderr';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { Notification } from '../../Structures/Database/DBClass';

class Account extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] View Account';
        this.path = '/api/account';
        this.reqAuth = true;

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check headers, and check auth
        const auth = !req.cookies?.token ? await this.Utils.authPassword(req) : await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // Return a nice version of this users account.
        const acc: {
            username: string;
            userID: string;
            admin: boolean;
            owner: boolean;
            files: number;
            links: number;
            custom_urls?: string[];
            email: string;
            pending_email?: string;
            notifications: Notification[];
            created: number;
        } = {
            username: auth.username, // eslint-disable-next-line @typescript-eslint/camelcase
            userID: auth.userID,
            admin: !!auth.admin,
            owner: !!auth.first,
            files: auth.files,
            links: auth.links,
            email: auth.email, // eslint-disable-next-line @typescript-eslint/camelcase
            pending_email: auth.pendingEmail,
            notifications: auth.notifs, // eslint-disable-next-line @typescript-eslint/camelcase
            custom_urls: auth.cURLs,
            created: Math.round(auth.created.getTime() / 1000),
        };
        return res.status(this.codes.ok).json( { message: acc, code: this.codes.ok } );
    }
}

export default Account;
