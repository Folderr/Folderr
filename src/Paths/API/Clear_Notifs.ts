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
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { Response } from 'express';

/**
 * @classdesc Clear the authorized users notifications 
 */
class ClearNotifs extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Clear Notifications';
        this.path = '/api/notifications';
        this.reqAuth = true;

        this.type = 'delete';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authorization.verifyAccount(req.headers.authorization);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // Clear the notifications and tell the user that happened
        await this.base.db.updateUser( { userID: auth.userID }, { notifs: [] } );
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default ClearNotifs;
