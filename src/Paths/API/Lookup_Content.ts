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
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { User } from '../../Structures/Database/DBClass';

/**
 * @classdesc Allows admins to lookup content
 */
class Lookup extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Lookup Content';
        this.path = '/api/admin/content/:type/:id';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed' } );
        }
        if (!req.params?.type || !req.params?.id || !['file', 'link'].includes(req.params.type) || !/^[A-Za-z0-9]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid requirements' } );
        }
        try {
            const out = req.params.type === 'file' ? await this.base.db.findFile( { ID: req.params.id } ) : await this.base.db.findLink( { ID: req.params.id } );
            if (!out) {
                return res.status(this.codes.noContent).json( { code: this.Utils.FoldCodes.db_not_found, message: {} } );
            }
            return res.status(this.codes.ok).json( { code: this.codes.ok, message: out } );
        } catch (e) {
            return res.status(this.codes.internalErr).json( { code: this.Utils.FoldCodes.db_error, message: `An error occurred!\n${e.message || e}` } );
        }
    }
}

export default Lookup;
