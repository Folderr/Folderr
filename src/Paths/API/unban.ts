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

import {Response, Request} from 'express';
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {User} from '../../Structures/Database/db-class';

/**
 * @classdesc Unbans a email from the service
 */
class Unban extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Unban';

		this.path = '/api/admin/ban';
		this.type = 'delete';
	}

	async execute(request: Request, response: Response): Promise<void | Response> {
		const auth = await this.Utils.authPassword(request, (user: User) => Boolean(user.admin));
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.body?.email || this.core.emailer.validateEmail(request.body.email)) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Missing or invalid requirements'
			});
		}

		const unban = await this.core.db.removeFolderrBan(request.body.email);
		if (unban) {
			response.status(this.codes.ok).json({code: this.codes.ok, message: 'OK'}).end();
		} else {
			response.status(this.codes.notAccepted).json({
				code: this.codes.notAccepted,
				message: 'UNBAN FAILED'
			}).end();
		}
	}
}

export default Unban;
