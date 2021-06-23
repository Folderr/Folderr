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

import {Response} from 'express';
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {User} from '../../Structures/Database/db-class';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Warn a user
 */
class WarnUser extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Warn User';
		this.path = '/api/admin/warn/:id';
		this.type = 'post';
	}

	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		const auth = await this.Utils.authPassword(request, (user: User) =>
			Boolean(user.admin)
		);
		if (!auth) {
			response
				.status(this.codes.unauth)
				.json({
					code: this.codes.unauth,
					message: 'Authorization failed.'
				})
				.end();
			return;
		}

		if (
			!request.params?.id ||
			!request.body?.reason ||
			typeof request.body.reason !== 'string' ||
			!/^\d+$/.test(request.params.id)
		) {
			response
				.status(this.codes.badReq)
				.json({
					code: this.codes.badReq,
					message: 'Requirements missing or invalid!'
				})
				.end();
			return;
		}

		const user = await this.core.db.findUser({id: request.params.id});
		if (!user) {
			response
				.status(this.codes.notAccepted)
				.json({
					code: this.Utils.FoldCodes.dbNotFound,
					message: 'User not found!'
				})
				.end();
			return;
		}

		const id = await this.Utils.genNotifyID();
		const updated = await this.core.db.updateUser(
			{id: request.params.id},
			{
				$addToSet: {
					notifs: {
						id,
						title: 'Warn',
						notify: `You were warned for: ${request.body.reason as string}`
					}
				}
			}
		);
		if (!updated) {
			response
				.status(this.codes.notAccepted)
				.json({
					code: this.Utils.FoldCodes.unkownError,
					message: 'Warn failed'
				})
				.end();
			return;
		}

		if (this.core.emailer.active) {
			const url = await this.Utils.determineHomeURL(request);
			await this.core.emailer.warnEmail(
				user.email,
				request.body.reason,
				user.username,
				url
			);
		}

		return response.status(this.codes.ok).json({
			code: this.codes.ok,
			message: 'OK'
		});
	}
}

export default WarnUser;
