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

import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Logout extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'logout';
        this.path = '/logout';
        this.enabled = !this.base.options.apiOnly;
    }

    /**
     * @desc Logs you out or displays the deleted account page, if you decided to delete your account.
     */
    execute(req: any, res: any): Promise<Response | void> {
        const dir = join(__dirname, '../Frontend/loggedout.html');
        if (req.query && req.query.d === 't') {
            res.clearCookie('token', { sameSite: 'Strict' } );
            this.evolve.Session.removeSession(req, res);
            return res.sendFile(join(__dirname, '../Frontend/deleted_account.html') );
        }
        if (!req.uauth) {
            return res.redirect('/');
        }
        res.clearCookie('token', { sameSite: 'Strict' } );
        this.evolve.Session.removeSession(req, res);
        return res.sendFile(dir);
    }
}

export default Logout;
