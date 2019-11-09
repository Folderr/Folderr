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

import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Evolve from '../../Structures/Evolve';
import { Response } from 'express';
import { UserI } from '../../Schemas/User';

class AdminNotification extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/admin_notification';
        this.reqAuth = true;

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req, (user: UserI) => !!user.admin) : await this.Utils.authCookies(req, res, (user: UserI) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Verify query
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] Notification ID required!');
        }

        // Find notification. If not found, return a not found status code
        const notify = await this.base.schemas.AdminNotifs.findOne( { ID: req.query.id } );
        if (!notify) {
            return res.status(this.codes.noContent).send();
        }

        // Oh look a notification!
        return res.status(this.codes.ok).send(notify);
    }
}

export default AdminNotification;
