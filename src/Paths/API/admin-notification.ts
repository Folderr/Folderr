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

import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {Response} from 'express';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc View the admin notification
 */
class AdminNotification extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Notification';
		this.path = '/api/admin/notification/:id';
		this.reqAuth = true;

		this.type = 'get';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Check auth
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Verify query
		if (!request.params?.id) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Notification ID required!'
			});
		}

		// Find notification. If not found, return a not found status code
		const notify = await this.core.db.findAdminNotify({ID: request.params.id});
		if (!notify) {
			return response.status(this.codes.noContent).json({
				code: this.Utils.FoldCodes.dbNotFound,
				message: []
			});
		}

		// Oh look a notification!
		return response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: notify});
	}
}

export default AdminNotification;
