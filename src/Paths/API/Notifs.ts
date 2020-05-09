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
import { Notification } from '../../Schemas/User';

class Notifs extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Notifications';
        this.path = '/api/notifications';

        this.type = 'get';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth by token/id
        const auth = !req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.headers.authorization) : await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        // Grab the notifications from the user
        // eslint-disable-next-line prefer-destructuring
        let notifs: string[] | Notification[] | undefined = auth.notifs;
        // If the user wants to view admin notifications
        if (req.query && req.query.admin === 'true') {
            // If they arent a admin, they do not get to see these notifications
            if (!auth.admin) {
                return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed. Who are you?' } );
            }
            // Get the notifications, and reset the notifications array
            const anotifs = await this.base.db.findAdminNotifies( {} );
            notifs = anotifs.map( (notification: Notification) => `{ "ID":"${notification.ID}","title":"${notification.title}","notify":"${notification.notify.replace(/\n/g, ',')}" }`);
        }

        // Return whatever notifications there are
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: notifs } );
    }
}

export default Notifs;
