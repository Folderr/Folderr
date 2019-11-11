/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Account extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] View Account';
        this.path = '/api/account';
        this.reqAuth = true;

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check headers, and check auth
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authPassword(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Upload.find( { owner: auth.uID } );
        const shorts = await this.base.schemas.Shorten.find( { owner: auth.uID } );

        // Return a nice version of this users account.
        const acc = {
            username: auth.username, // eslint-disable-next-line @typescript-eslint/camelcase
            token_generated: !!auth.token,
            uID: auth.uID,
            admin: !!auth.admin,
            owner: !!auth.first,
            images: images.length,
            shorts: shorts.length,
        };
        return res.status(this.codes.ok).send(acc);
    }
}

export default Account;
