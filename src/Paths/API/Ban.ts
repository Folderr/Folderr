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

class Ban extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Ban';

        this.path = '/api/admin/ban/:id';
        this.type = 'post';
    }

    async execute(req: Request, res: Response) {
        const auth = req.cookies?.token ? this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : this.Utils.authorization.verifyAccount(req.headers?.authorization, { fn: (user: User) => !!user.admin } );
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        if (!req.params?.id || !req.body?.reason || !/^[0-9]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing requirements' } );
        }
        const user = await this.base.db.findUser( { userID: req.params.id } );
        if (!user) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } );
        }
        const email = this.Utils.decrypt(user.email);
        if (this.base.emailer.active) {
            const url = await this.Utils.determineHomeURL(req);
            await this.base.emailer.banEmail(email, req.body.reason, user.username, url);
        }
        const ban = await this.base.db.addFolderrBan(email);
        if (ban) {
            await this.base.db.purgeUser(user.userID);
            res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } ).end();
        } else {
            res.status(this.codes.notAccepted).json( { code: this.codes.notAccepted, message: 'BAN FAILED' } ).end();
        }
        this.base.addDeleter(user.userID);
        // eslint-disable-next-line consistent-return
        return;
    }
}

export default Ban;