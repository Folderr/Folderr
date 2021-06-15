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
 * @classdesc Make a user an administrator
 */
class AddAdmin extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Add Admin';
		this.path = '/api/manage/admin/:id';
		this.reqAuth = true;

		this.type = 'post';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		const auth = await this.Utils.authPassword(request, (user) =>
			Boolean(user.first)
		);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// You need to use the query to supply the users ID
		if (!request.params || !request.params.id) {
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
			{admin: true},
			'admin'
		);
		if (!user) {
			return response.status(this.codes.notFound).json({
				message: 'User not found!',
				code: this.Utils.FoldCodes.dbNotFound
			});
		}

		if (!user.admin) {
			return response.status(this.codes.notAccepted).json({
				message: 'Update fail!',
				code: this.Utils.FoldCodes.dbUnkownError
			});
		}

		const responsible = `${auth.username} (${auth.id})`;
		const userFormatted = `${user.username} (${user.id})`;

		user.admin = true;
		this.core.logger.info(
			`Administrator privileges granted to user ${userFormatted} by ${responsible}`
		);
		return response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: 'OK'});
	}
}

export default AddAdmin;
