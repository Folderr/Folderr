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

class DelNotify extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete notification';
        this.path = '/api/notification/:id';

        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authorization.verifyAccount(req.headers.authorization);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        // Check query
        if (!req.params?.id) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing notification ID' } );
        }

        // Grab the users notifications, and find the one they are looking for
        const { notifs } = auth;
        if (!notifs) {
            return res.status(this.codes.notFound).json( { code: this.codes.notFound, message: 'You have no notifications!' } );
        }
        const notify = notifs.find(notification => notification.ID === req.params.id);
        // If no notification, tell the user that notification does not exist
        if (!notify) {
            return res.status(this.codes.notFound).json( { code: this.Utils.FoldCodes.db_not_found, message: 'Notification not found!' } );
        }
        // Remove the notification, update the users account, and return success
        await this.base.db.updateUser( { uID: auth.userID }, { $pull: { notifs: { ID: req.params.id } } } );
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default DelNotify;
