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

class Users extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Users';
        this.path = '/api/users';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req, (user) => !!user.admin) : await this.Utils.authCookies(req, res, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Upload.find( {} );
        const shorts = await this.base.schemas.Shorten.find( {} );

        const users = await this.base.schemas.User.find( {} );
        const arr = [];
        for (const user of users) {
            const obj = {
                username: user.username,
                uID: user.uID,
                title: '',
                images: images.filter(image => image.owner === user.uID).length,
                shorts: shorts.filter(short => short.owner === user.uID).length,
            };
            if (user.first) {
                obj.title = 'Owner';
            } else if (user.admin) {
                obj.title = 'Admin';
            }
            if (user.uID === auth.uID) {
                obj.username += ' (You)';
            }
            arr.push(obj);
        }
        return res.status(this.codes.ok).send(arr);
    }
}

export default Users;
