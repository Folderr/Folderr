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
 * @classdesc Allows admins to lookup content
 */
class Lookup extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Lookup Content';
		this.path = '/api/admin/content/:type/:id';
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
			!/^[A-Za-z\d]+$/.test(request.params.id)
		) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Missing or invalid requirements'
			});
		}

		try {
			const out =
				request.params.type === 'file'
					? await this.core.db.findFile({id: request.params.id})
					: await this.core.db.findLink({id: request.params.id});
			if (!out) {
				return response.status(this.codes.noContent).json({
					code: this.Utils.FoldCodes.dbNotFound,
					message: {}
				});
			}

			return response
				.status(this.codes.ok)
				.json({code: this.codes.ok, message: out});
		} catch (error: unknown) {
			return response.status(this.codes.internalErr).json({
				code: this.Utils.FoldCodes.dbError,
				message: `An error occurred!\n${
					(error as Error).message || (error as string)
				}`
			});
		}
	}
}

export default Lookup;
