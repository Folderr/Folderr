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

import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Core from '../../Structures/Core';
import { User } from '../../Structures/Database/DBClass';

/**
 * @classdesc Allows admins to look up accounts
 */
class LookupAccount extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Reverse Account Lookup';
        this.path = '/api/admin/content/:type/:id/account';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed' } );
        }
        if (!req.params?.type || !req.params?.id || !['file', 'link'].includes(req.params.type) || !/^[0-9A-Za-z]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid requirements' } );
        }
        const out = req.params.type === 'file' ? await this.core.db.findFile( { ID: req.params.id } ) : await this.core.db.findLink( { ID: req.params.id } );
        if (!out) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.dbNotFound, message: `${req.params.type[0].toUpperCase()}${req.params.type.slice(1)} not found!` } );
        }
        const user = await this.core.db.findUser( { userID: out.owner }, 'userID username email created');
        if (!user) {
            return res.status(this.codes.ok).json( { code: this.codes.ok, message: {} } );
        }
        user.email = this.Utils.decrypt(user.email);
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: { email: user.email, username: user.username, userID: user.userID, created: Number(user.created) } } );
    }
}

export default LookupAccount;
