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
import {TokenDB} from '../../Structures/Database/db-class';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Allow a user to generate a token
 */
class GenToken extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Generate Token';
		this.path = '/api/account/token';

		this.type = 'post';
		this.reqAuth = true;
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Check auth
		const auth = await this.Utils.authPassword(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		const tokens = await this.core.db.findTokens(auth.id, {web: false});

		if (
			tokens.length > 10 &&
			!(
				request.query &&
				!request.query.override &&
				request.query.override !== 'true'
			)
		) {
			return response.status(this.codes.forbidden).json({
				// This is string
				code: this.Utils.FoldCodes.tokenSizeLimit,
				/* eslint-disable max-len */
				message:
					'You have maxed out your tokens! Either delete one or re-request with "?override=true" at the end of the url.'
				/* eslint-enable max-len */
			});
		}

		if (
			tokens.length >= 10 &&
			request.query?.override &&
			request.query.override === 'true'
		) {
			const tkns = tokens.sort(
				(a: TokenDB, b: TokenDB) => Number(a.created) - Number(b.created)
			);
			await this.core.db.purgeToken(tkns[0].id, tkns[0].userID, {web: false});
		}

		const token = await this.Utils.authorization.genKey(auth.id);
		return response
			.status(this.codes.created)
			.json({code: this.codes.ok, message: token});
	}
}

export default GenToken;
