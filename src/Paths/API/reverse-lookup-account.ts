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
 * @classdesc Allows admins to look up accounts
 */
class LookupAccount extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Reverse Account Lookup';
		this.path = '/api/admin/content/:type/:id/account';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		const auth = await this.Utils.authPassword(request, (user: User) =>
			Boolean(user.admin)
		);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed'
			});
		}

		if (
			!request.params?.type ||
			!request.params?.id ||
			!['file', 'link'].includes(request.params.type) ||
			!/^[\dA-Za-z]+$/.test(request.params.id)
		) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Missing or invalid requirements'
			});
		}

		const out =
			request.params.type === 'file'
				? await this.core.db.findFile({ID: request.params.id})
				: await this.core.db.findLink({ID: request.params.id});
		if (!out) {
			const formattedType = request.params.type === 'file' ? 'File' : 'Link';
			console.log(formattedType);
			return response.status(this.codes.notAccepted).json({
				code: this.Utils.FoldCodes.dbNotFound,
				message: `${formattedType} not found!`
			});
		}

		const user = await this.core.db.findUser(
			{userID: out.owner},
			'userID username email created'
		);
		if (!user) {
			return response.status(this.codes.ok).json({
				code: this.codes.ok,
				message: {}
			});
		}

		user.email = this.Utils.decrypt(user.email);
		return response.status(this.codes.ok).json({
			code: this.codes.ok,
			message: {
				email: user.email,
				username: user.username,
				userID: user.userID,
				created: Number(user.created)
			}
		});
	}
}

export default LookupAccount;
