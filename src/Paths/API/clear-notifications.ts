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
import {Response, Request} from 'express';

/**
 * @classdesc Clear the authorized users notifications
 */
class ClearNotifs extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Clear Notifications';
		this.path = '/api/notifications';
		this.reqAuth = true;

		this.type = 'delete';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Clear the notifications and tell the user that happened
		await this.core.db.updateUser({id: auth.id}, {notifs: []});
		return response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: 'OK'});
	}
}

export default ClearNotifs;
