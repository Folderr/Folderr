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

class DenyAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Deny Account';

        this.path = '/api/verify';
        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth by id/token
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req, (user) => !!user.admin) : await this.Utils.authCookies(req, res, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Verify body
        if (!req.body.token && !req.body.uid) {
            return res.status(this.codes.badReq).send('[ERROR] BODY MISSING!');
        } if (!req.body.token || !req.body.uid) {
            return res.status(this.codes.badReq).send('[ERROR] BODY INCOMPLETE!');
        }
        // Search for the user, and if not found send in an error
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.notFound).send('[ERROR] User not found!');
        }
        // Deny the account via verifying
        await this.base.schemas.VerifyingUser.findOneAndRemove( { uID: user.uID } );
        // Find the admin notification, and remove it
        const notifs = await this.base.schemas.AdminNotifs.find();
        const notify = notifs.find(notif => notif.notify.includes(user.uID) );
        await this.base.schemas.AdminNotifs.deleteOne(notify);
        // Log that the account was denied by admin x, and tell the admin the account wa denied
        // console.log(`[INFO] - User ${user.uID}'s account was denied by admin ${auth.username} (${auth.uID})`);
        this.base.Logger.log('SYSTEM INFO', 'User account denied by administrator', { user: `${user.username} (${user.uID})`, responsible: `${auth.username} (${auth.uID})` }, 'accountDeny', 'Account denied by Admin');
        return res.status(this.codes.ok).send('[SUCCESS] Denied user!');
    }
}

export default DenyAccount;
