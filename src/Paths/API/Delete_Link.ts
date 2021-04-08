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
import { Request } from '../../Structures/Interfaces/ExpressExtended';

/**
 * @classdesc Allow the user to delete a shortened link
 */
class DeleteLink extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Delete Link';
        this.path = '/api/link/:id';

        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check auth
        const auth = await this.checkAuth(req);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // Check query
        if (!req.params?.id) {
            return res.status(this.codes.badReq).send( { code: this.codes.badReq, message: 'MISSING ID!' } );
        }

        const short = await this.core.db.purgeLink( { ID: req.params.id, owner: auth.userID } );
        if (!short) {
            return res.status(this.codes.notFound).send( { code: this.Utils.FoldCodes.dbNotFound, message: 'Link not found!' } );
        }

        return res.status(this.codes.ok).send( { code: this.codes.ok, message: 'OK' } );
    }
}

export default DeleteLink;
