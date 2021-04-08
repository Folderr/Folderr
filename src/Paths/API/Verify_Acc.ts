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
import { Request } from '../../Structures/Interfaces/ExpressExtended';

/**
 * @classdesc Administrators verify accounts via this endpoint
 */
class VerifyAccount extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Verify Account';

        this.path = '/api/admin/verify';
        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Handle authorization
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        if (!req.body || !req.body.token || !req.body.userid) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'BODY MISSING OR IMPARTIAL!' } );
        }

        // Look for the user
        const user = await this.Utils.findVerifying(req.body.token, req.body.userid);
        if (!user) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.dbNotFound, message: 'User not found!' } );
        }

        // Remove the user from verifying schema and add them to the actual user base
        const { username, userID } = user;
        await this.core.db.verifyUser(userID);

        // Alert the console and the admin that the user was verified
        this.core.logger.info(`User account ${username} (${userID}) granted by administrator ${auth.username} (${auth.userID})`);
        return res.status(this.codes.created).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default VerifyAccount;
