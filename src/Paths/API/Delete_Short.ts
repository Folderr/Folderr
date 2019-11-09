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

class DeleteShort extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Short';
        this.path = '/api/short';

        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Check query
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] MISSING ID!');
        }

        const short = await this.base.schemas.Shorten.findOneAndRemove( { ID: req.query.id } );
        if (!short) {
            return res.status(this.codes.notFound).send('[ERROR] Short not found!');
        }
        // console.log(`[INFO - SHORTS] - Short ${short.ID} removed!`);
        this.base.Logger.log('INFO - SHORTS', `Short ${short.ID} deleted`, { user: `${auth.username} (${auth.uID})` }, 'shortRemove', 'Short deleted by user');

        return res.status(this.codes.ok).send('[SUCCESS] Short removed!');
    }
}

export default DeleteShort;
