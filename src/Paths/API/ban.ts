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
 * @classdesc Ban a user via ID
 */
class Ban extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Ban';

		this.path = '/api/admin/ban/:id';
		this.type = 'post';
	}

	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (
			!request.params?.id ||
			!request.body?.reason ||
			!/^\d+$/.test(request.params.id)
		) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Missing requirements'
			});
		}

		const user = await this.core.db.findUser({id: request.params.id});
		if (!user) {
			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.dbNotFound,
				message: 'User not found!'
			});
		}

		if (this.core.emailer.active) {
			const url = await this.Utils.determineHomeURL(request);
			await this.core.emailer.banEmail(
				user.email,
				request.body.reason,
				user.username,
				url
			);
		}

		const ban = await this.core.db.addFolderrBan(user.email);
		if (ban) {
			await this.core.db.purgeUser(user.id);
			response
				.status(this.codes.ok)
				.json({
					code: this.codes.ok,
					message: 'OK'
				})
				.end();
		} else {
			response
				.status(this.codes.notAccepted)
				.json({
					code: this.codes.notAccepted,
					message: 'BAN FAILED'
				})
				.end();
		}

		this.core.addDeleter(user.id);
	}
}

export default Ban;
