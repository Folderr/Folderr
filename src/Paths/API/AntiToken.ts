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
import crypto from 'crypto';
import { Response } from 'express';

class AntiCSRF extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Info';
        this.path = '/api/anti';
        this.reqAuth = true;
    }

    /**
     * @desc Generate a secure csrf token pair to secure form requests with.
     * @param req
     * @param res
     */
    async execute(req: any, res: any): Promise<Response> {
        const antisize = 64;
        const localsize = 16;
        const tkn = crypto.randomBytes(antisize).toString('hex');
        const utkn = crypto.randomBytes(localsize).toString('base64');
        const mins = 1200000;
        const nDate = new Date(Date.now() + mins);
        this.evolve.antiTokens.set(utkn, { token: tkn, expire: nDate } );
        return res.status(this.codes.ok).send( { _csrf: tkn } );
    }
}

export default AntiCSRF;
