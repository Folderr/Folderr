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

class DeleteLink extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Link';
        this.path = '/api/link/:id';

        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authorization.verifyAccount(req.headers.authorization);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // Check query
        if (!req.params?.id) {
            return res.status(this.codes.badReq).send( { code: this.codes.badReq, message: 'MISSING ID!' } );
        }

        const short = await this.base.db.purgeLink( { ID: req.params.id, owner: auth.userID } );
        if (!short) {
            return res.status(this.codes.notFound).send( { code: this.Utils.FoldCodes.db_not_found, message: 'Link not found!' } );
        }
        // console.log(`[INFO - SHORTS] - Link ${short.ID} removed!`);
        this.base.Logger.log('INFO - SHORTS', `Short ${req.params.id} deleted`, { user: `${auth.username} (${auth.userID})` }, 'shortRemove', 'Link deleted by user');

        return res.status(this.codes.ok).send( { code: this.codes.ok, message: 'OK' } );
    }
}

export default DeleteLink;
