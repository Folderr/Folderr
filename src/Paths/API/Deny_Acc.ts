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
import Core from '../../Structures/Core';
import { Response } from 'express';
import { User } from '../../Structures/Database/DBClass';

/**
 * @classdesc Admin can deny a users account
 */
class DenyAccount extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Deny Account';

        this.path = '/api/admin/verify';
        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth by id/token
        const auth = !req.cookies && !req.cookies.token ? await this.Utils.authorization.verifyAccount(req.headers.authorization, { fn: (user: User) => !!user.admin } ) : await this.Utils.authorization.verifyAccount(req.cookies.token, { fn: (user) => !!user.admin, web: true } );
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // Verify body
        if (!req.body.token && !req.body.uid) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'BODY MISSING!' } );
        } if (!req.body.token || !req.body.uid) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'BODY INCOMPLETE!' } );
        }
        // Search for the user, and if not found send in an error
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.notFound).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } );
        }
        // Deny the account & delete notification
        await this.core.db.denyUser(user.userID);
        // Log that the account was denied by admin x, and tell the admin the account wa denied
        this.core.logger.info(`User account denied by administrator (${user.username} - ${user.userID})`);
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default DenyAccount;
