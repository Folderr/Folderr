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

class Verify extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Verify Self';
        this.path = '/verify/:userID/:token';
        this.enabled = this.base.emailer.active && this.base.options.signups === 2;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        if (!req.params?.userID || !req.params?.token) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing requirements!' } );
        }
        const verify = await this.Utils.findVerifying(req.params.token, req.params.userID);
        if (!verify) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } );
        }
        const expiresAfter = 172800000; // 48H in MS
        const timeSinceCreation = Date.now() - Number(verify.created);
        if (timeSinceCreation >= expiresAfter) {
            await this.base.db.denySelf(verify.userID);
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.user_denied, message: 'Validation time expired.' } );
        }
        await this.base.db.verifySelf(verify.userID);

        this.base.Logger.log('SYSTEM INFO', 'User account verified by self', { user: `${verify.username} (${verify.userID}`, responsible: `${verify.username} (${verify.userID})` }, 'accountAccept', 'Account Verified');
        return res.status(this.codes.created).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default Verify;
