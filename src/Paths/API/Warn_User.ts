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

import { Response } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { User } from '../../Structures/Database/DBClass';

/**
 * @classdesc Warn a user
 */
class WarnUser extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Warn User';
        this.path = '/api/admin/warn/:id';
        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } ).end();
        }
        if (!req.params?.id || !req.body?.reason || !/^[0-9]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Requirements missing or invalid!' } ).end();
        }
        const user = await this.base.db.findUser( { userID: req.params.id } );
        if (!user) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } ).end();
        }
        const email = this.Utils.decrypt(user.email);
        const id = await this.Utils.genNotifyID();
        const updated = await this.base.db.updateUser( { userID: req.params.id }, { $addToSet: { notifs: { ID: id, title: 'Warn', notify: `You were warned for: ${req.body.reason}` } } } );
        if (!updated) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.unknown_error, message: 'Warn failed' } ).end();
        }
        if (this.base.emailer.active) {
            const url = await this.Utils.determineHomeURL(req);
            await this.base.emailer.warnEmail(email, req.body.reason, user.username, url);
        }
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default WarnUser;
