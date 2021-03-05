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

/**
 * @classdesc Make a user an administrator
 */
class AddAdmin extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Add Admin';
        this.path = '/api/manage/admin/:id';
        this.reqAuth = true;

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = await this.Utils.authPassword(req, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // You need to use the query to supply the users ID
        if (!req.params || !req.params.id) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Users ID is required!' } );
        }
        const match = req.params.id.match(/^[0-9]+$/);
        if (!match || match[0].length !== req.params.id.length) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'ID is not a valid Folderr ID!' } );
        }
        const user = await this.core.db.findAndUpdateUser( { uID: req.params.id, $nor: [{ admin: false }, { first: true }] }, { admin: true }, 'admin');
        if (!user) {
            return res.status(this.codes.notFound).json( { message: 'User not found!', code: this.Utils.FoldCodes.db_not_found } );
        }
        if (!user.admin) {
            return res.status(this.codes.notAccepted).json( { message: 'Update fail!', code: this.Utils.FoldCodes.db_unknown_error } );
        }
        user.admin = true;
        this.core.logger.info(`Administrator privileges granted to user ${user.username} (${user.userID}) by ${auth.username} (${auth.username}).`);
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: `OK` } );
    }
}

export default AddAdmin;
