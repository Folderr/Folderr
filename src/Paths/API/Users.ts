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
import { User } from '../../Structures/Database/DBClass';

/**
 * @classdesc Shows users to admins
 */
class Users extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Users';
        this.path = '/api/admin/users';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        const query: { $gt?: { created: Date }; $lt?: { created: Date }; userID?: string; username?: RegExp } = {};
        if (req.query?.type && req.query?.query) {
            if (req.query.type === 'userID') {
                query.userID = req.query.query;
            } else if (req.query.type === 'username') {
                query.username = new RegExp(`^${req.query.query}`);
            }
        } else if (req.query?.query && !req.query?.type) {
            query.userID = req.query.query;
        }
        const opts: { sort?: object; limit?: number; selector: string } = req.query?.gallery ? { sort: { created: -1 }, selector: 'username admin first email files links userID' } : { sort: { created: -1 }, selector: 'username admin first email files links userID' };
        if (req.query?.gallery) {
            if (req.query?.limit >= 20) {
                opts.limit = 20;
            } else if (req.query?.limit >= 15) {
                opts.limit = 20;
            } else if (req.query?.limit >= 10 && req.query?.limit < 15) {
                opts.limit = 10;
            } else if (req.query?.limit <= 10) {
                opts.limit = 10;
            } else {
                opts.limit = 10;
            }
        } else {
            opts.limit = 20;
        }
        if (req.query?.before) {
            if (req.query.before instanceof Date) {
                query.$lt = { created: req.query.before };
            } else if (req.query.before instanceof Number) {
                query.$lt = { created: new Date(req.query.before) };
            }
        }
        if (req.query?.after) {
            if (req.query.before instanceof Date) {
                query.$gt = { created: req.query.after };
            } else if (req.query.before instanceof Number) {
                query.$gt = { created: new Date(req.query.after) };
            }
        }

        const users: User[] = await this.base.db.findUsers(query, opts);
        if (users.length === 0) {
            return res.status(this.codes.ok).json( { code: this.Utils.FoldCodes.db_not_found, message: [] } );
        }
        const arr: {
            title?: string | boolean;
            username: string;
            files: number;
            links: number;
            email: string;
            userID: string;
            created: number;
        }[] = users.map( (user: User) => {
            return {
                title: !user.admin && !user.first ? '' : (user.admin && 'admin') || (user.first && 'first'),
                username: user.username,
                files: user.files,
                links: user.links,
                email: user.email,
                userID: user.userID,
                created: Math.round(user.created.getTime() / 1000),
            };
        } );
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: arr } );
    }
}

export default Users;
