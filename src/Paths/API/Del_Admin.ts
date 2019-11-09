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

class DeleteAdmin extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Admin';
        this.path = '/api/admin';
        this.reqAuth = true;

        this.type = 'delete';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Actually check auth, and make sure they are the owner
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authPassword(req, (user) => !!user.first) : await this.Utils.authCookies(req, res, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // You need to supply the ID for the user via query
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] Users ID is required!');
        }
        const match = req.query.id.match(/[0-9]+/);
        if (!match || match[0].length !== req.query.id.length) {
            return res.status(this.codes.badReq).send('[ERROR] ID is not a valid Evolve-X ID!');
        }
        const user = await this.base.schemas.User.findOne( { uID: req.query.id } );
        if (!user) {
            return res.status(this.codes.notFound).send('[ERROR] User not found!');
        }
        if (!user.admin) {
            return res.status(this.codes.ok).send('[ERROR] User is not admin!');
        }
        user.admin = false;
        await user.save();
        // console.log(`[SYSTEM INFO - ADMIN] - Admin removed for user ${user.username}`);
        this.base.Logger.log(`SYSTEM NOTICE - ADMIN`, 'Administration privileges removed for user.', { user: `${user.username} (${user.uID})`, responsible: `${auth.username} (${auth.uID})` }, 'adminRemove', 'Administrator demoted.');
        return res.status(this.codes.ok).send(`[SUCCESS] Updated users admin status!`);
    }
}

export default DeleteAdmin;
