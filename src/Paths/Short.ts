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

import { Response } from 'express';
import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { join } from 'path';

class Short extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Short';
        this.path = '/short/:id';
    }

    /**
     * @desc Sends a user to a shortened link.
     */
    async execute(req: any, res: any): Promise<Response|void> {
        if (!req.params || !req.params.id) {
            return res.status(this.codes.badReq).send('[ERROR] Missing short ID.');
        }
        const short = await this.base.schemas.Shorten.findOne( { ID: req.params.id } );
        if (!short) {
            return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/notfound.html') );
        }
        return res.redirect(short.link.trim() );
    }
}

export default Short;
