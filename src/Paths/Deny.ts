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

import Path from '../Structures/Path';
import Folderr from '../Structures/Folderr';
import Base from '../Structures/Base';
import { Response, Request } from 'express';

class Deny extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Deny Self';
        this.path = '/deny/:userid/:token';
        this.enabled = this.base.emailer.active && this.base.options.signups === 2;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        if (!req.params?.userid || !req.params?.token) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing requirements!' } );
        }
        const verify = await this.Utils.findVerifying(req.params.token, req.params.userid);
        if (!verify) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } );
        }
        await this.base.db.denySelf(verify.userID);

        this.base.Logger.log('SYSTEM INFO', 'User account denied by self', { user: `${verify.username} (${verify.userID}`, responsible: `${verify.username} (${verify.userID})` }, 'accountDeny', 'Account Denied');
        return res.status(this.codes.created).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default Deny;