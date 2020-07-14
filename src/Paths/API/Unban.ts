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
 * @classdesc Unbans a email from the service
 */
class Unban extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Unban';

        this.path = '/api/admin/ban';
        this.type = 'delete';
    }

    async execute(req: Request, res: Response) {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        if (!req.body?.email || this.base.emailer.validateEmail(req.body.email) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid requirements' } );
        }
        const unban = await this.base.db.removeFolderrBan(req.body.email);
        if (unban) {
            res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } ).end();
        } else {
            res.status(this.codes.notAccepted).json( { code: this.codes.notAccepted, message: 'UNBAN FAILED' } ).end();
        }
        // eslint-disable-next-line consistent-return
        return;
    }
}

export default Unban;
