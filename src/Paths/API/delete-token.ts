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

/**
 * @classdesc Allow the user to delete a token they have created
 */
class DeleteToken extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Delete Token';
		this.path = '/api/account/token/:id';
		this.type = 'delete';
	}

	async execute(request: Request, response: Response): Promise<Response | void> {
		const auth = request.cookies?.token ? await this.Utils.authorization.verifyAccount(request.cookies.token, {web: true}) : await this.Utils.authPassword(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({message: 'Authorization failed', code: this.codes.unauth});
		}

		if (!request.params?.id || /^\d+$/.test(request.params.id)) {
			return response.status(this.codes.badReq).json({code: this.codes.badReq, message: 'Missing or invalid token ID!'});
		}

		const del = await this.core.db.purgeToken(request.params.id, auth.userID, {web: Boolean(request.query?.web) || false});
		if (!del) {
			return response.status(this.codes.notAccepted).json({code: this.codes.badReq, message: 'Token not deleted/found!'});
		}

		return response.status(this.codes.ok).json({code: this.codes.ok, message: 'OK'});
	}
}

export default DeleteToken;
