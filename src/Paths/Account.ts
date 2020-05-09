/**
 * @license
 *
 * Folderr is an open source image host. https://gitlab.com/Folderr
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

import Path from '../Structures/Path';
import Folderr from '../Structures/Folderr';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Account extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Account';
        this.path = '/account';
        this.enabled = !this.base.options.apiOnly;
    }

    /**
     * @desc Account page only shows if you are signed in.
     */
    async execute(req: any, res: any): Promise<Response | void> {
        if (!req.uauth) {
            return res.redirect('./');
        }
        if (!req.secure && !this.Utils.verifyInsecureCookies(req) ) {
            return res.status(this.codes.notAccepted).sendFile(join(__dirname, '../Frontend/insecure_loggedIn.html') );
        }

        const dir = join(__dirname, '../Frontend/account.html');
        return res.sendFile(dir);
    }
}

export default Account;
