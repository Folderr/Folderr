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
import Core from '../Structures/Core';
import { Response } from 'express';
import { join } from 'path';

class Logout extends Path {
    constructor(core: Core) {
        super(core);
        this.label = 'logout';
        this.path = '/logout';
        this.enabled = !this.core.config.apiOnly;
    }

    /**
     * @desc Logs you out or displays the deleted account page, if you decided to delete your account.
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async execute(req: any, res: Response): Promise<Response | void> {
        const dir = join(__dirname, '../Frontend/loggedout.html');
        if (!req.uauth) {
            return res.redirect('/');
        }
        await this.Utils.authorization.revoke(req.cookies.token, true);
        res.clearCookie('token', { sameSite: 'strict' } );
        return res.sendFile(dir);
    }
}

export default Logout;
