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
import Core from '../../Structures/Core';
import { Response } from 'express';
import wlogger from '../../Structures/WinstonLogger';
import { Request } from '../../Structures/Interfaces/ExpressExtended';

/**
 * @classdesc Delete an admin notification.
 */
class DelANotify extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Delete notification';
        this.path = '/api/admin/notification/:id';
        this.reqAuth = true;

        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Authorize the user as admin, or throw error.
        const auth = await this.checkAuthAdmin(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send('Authorization failed.'); // Unauthorized
        }

        // In case they forgot the ID for the notification
        if (!req.params?.id) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing notification ID' } );
        }

        // Find the notification, and if it cant tell the user it  cannot find the notification with a code 404
        const notify = await this.core.db.findAdminNotify( { ID: req.params.id } );
        if (!notify) {
            return res.status(this.codes.notFound).json( { code: this.Utils.FoldCodes.dbNotFound, message: 'Notification not found!' } );
        }
        // Signup notifications are invincible, at least to manually remove
        if (notify.title === 'New user signup!') {
            return res.status(this.codes.forbidden).json( { code: this.codes.forbidden, message: 'Signup notifications cannot be removed!' } );
        }

        // Remove the admin notification and tell the admin it was removed
        await this.core.db.purgeAdminNotify( { ID: req.params.id } );
        wlogger.info(`[SYSTEM] Admin notification ${notify.ID} removed by ${auth.username}!`);
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default DelANotify;
