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
 * @classdesc Remove an administrators admin status
 */
class RemoveAdmin extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Remove Admin';
		this.path = '/api/manage/admin/:id';
		this.reqAuth = true;

		this.type = 'delete';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Actually check auth, and make sure they are the owner
		const auth = await this.Utils.authPassword(request, (user) =>
			Boolean(user.owner)
		);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: auth || 'Authorization failed.'
			});
		}

		// You need to supply the ID for the user via query
		if (!request.params?.id) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Users ID is required!'
			});
		}

		const match = /^\d+$/.exec(request.params.id);
		if (!match || match[0].length !== request.params.id.length) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'ID is not a valid Folderr ID!'
			});
		}

		const user = await this.core.db.findAndUpdateUser(
			{
				id: request.params.id,
				$nor: [{admin: false}, {first: true}]
			},
			{admin: false},
			'admin'
		);
		if (!user) {
			return response.status(this.codes.notFound).json({
				message: 'User not found!',
				code: this.Utils.FoldCodes.dbNotFound
			});
		}

		if (user.admin) {
			return response.status(this.codes.notAccepted).json({
				message: 'Update fail!',
				code: this.Utils.FoldCodes.dbUnkownError
			});
		}

		const responsible = `${auth.username} (${auth.id})`;
		const formerAdmin = `${user.username} (${user.id})`;
		this.core.logger.info(
			`Administator removed for ${formerAdmin} by ${responsible}`
		);
		return response.status(this.codes.ok).json({
			code: this.codes.ok,
			message: 'OK'
		});
	}
}

export default RemoveAdmin;
