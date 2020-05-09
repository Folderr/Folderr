/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 VoidNulll
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

class DeleteAdmin extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Admin';
        this.path = '/api/manage/admin/:id';
        this.reqAuth = true;

        this.type = 'delete';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Actually check auth, and make sure they are the owner
        const auth = await this.Utils.authPassword(req, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: auth || 'Authorization failed.' } );
        }

        // You need to supply the ID for the user via query
        if (!req.params?.id) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Users ID is required!' } );
        }
        const match = req.params.id.match(/^[0-9]+$/);
        if (!match || match[0].length !== req.params.id.length) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'ID is not a valid Folderr ID!' } );
        }
        const user = await this.base.db.findAndUpdateUser( { userID: req.params.id, $nor: [{ admin: false }, { first: true }] }, { admin: false }, 'admin');
        if (!user) {
            return res.status(this.codes.notFound).json( { message: 'User not found!', code: this.Utils.FoldCodes.db_not_found } );
        }
        if (user.admin) {
            return res.status(this.codes.notAccepted).json( { message: 'Update fail!', code: this.Utils.FoldCodes.db_unknown_error } );
        }
        // console.log(`[SYSTEM INFO - ADMIN] - Admin removed for user ${user.username}`);
        this.base.Logger.log(`SYSTEM NOTICE - ADMIN`, 'Administration privileges removed for user.', { user: `${user.username} (${user.userID})`, responsible: `${auth.username} (${auth.userID})` }, 'adminRemove', 'Administrator demoted.');
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: `OK` } );
    }
}

export default DeleteAdmin;
