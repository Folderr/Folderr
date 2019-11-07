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
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class DelANotify extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete notification';
        this.path = '/api/admin_notification';
        this.reqAuth = true;

        this.type = 'delete';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Authorize the user as admin, or throw error.
        const auth = await this.Utils.authToken(req, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?'); // Fuck off
        }

        // In case they fforgot the ID for the notification
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.badReq).send('[ERROR] Missing notification ID');
        }

        // Find the notification, and if it cant tell the user it  cannot find the notification with a code 404
        const notify = await this.base.schemas.AdminNotifs.findOne( { ID: req.query.id } );
        if (!notify) {
            return res.status(this.codes.notFound).send('[ERROR] Notification not found!');
        }
        // Signup notifications are invincible, at least to manual remove
        if (notify.title === 'forbidden') {
            return res.status(this.codes.forbidden).send('[ERROR] Signup notifications cannot be removed!');
        }

        // Remove the admin notification and tell the admin it was removed
        await this.base.schemas.AdminNotifs.findOneAndRemove( { ID: req.query.id } );
        console.log(`[SYSTEM INFO - NOTIFICATIONS] - Admin notification ${notify.ID} removed by ${auth.username}!`);
        return res.status(this.codes.ok).send('[SUCCESS] Notification removed!');
    }
}

export default DelANotify;
