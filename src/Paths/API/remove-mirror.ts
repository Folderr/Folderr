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
 * @classsdesc Allows users to remove a mirror
 */
class MirrorRemove extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Mirror Remove';
		this.path = '/api/account/mirror';

		this.type = 'delete';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.body || !request.body.mirror) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'No mirror given to remove!'
			});
		}

		if (auth.cURLs.length === 0 || !auth.cURLs.includes(request.body.mirror)) {
			return response.status(this.codes.badReq).json({
				message: 'Mirror not linked!',
				code: this.Utils.FoldCodes.dbNotFound
			});
		}

		await this.core.db.updateUser({userID: auth.userID}, {
			$pullAll: {
				cURLs: request.body.mirror
			}
		});
		return response.status(this.codes.ok).json({
			code: this.codes.ok,
			message: 'OK'
		});
	}
}

export default MirrorRemove;
