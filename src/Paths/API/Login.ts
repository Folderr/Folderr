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
import jsonwt from 'jsonwebtoken';

class Login extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Login';
        this.path = '/api/login';
        this.secureOnly = false;

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response|void> {
        if (!req.body || (req.body && (!req.body.username || !req.body.password) ) ) {
            if (req.body && (req.body.username || req.body.password) ) {
                return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'MISSING DETAIL(S)' } );
            }
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'MISSING ALL DETAILS' } );
        }

        const auth = await this.Utils.authPasswordBody(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        // Set the cookie to expire in a weeks time
        const week = 604800000;
        const endTime = new Date(Date.now() + (week * 2) );
        const jwt = await this.base.Utils.authorization.genKeyWeb(auth.userID);
        res.cookie('token', jwt, { expires: endTime, secure: false, httpOnly: true, sameSite: 'Strict' } );
        // Set cookies
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default Login;
