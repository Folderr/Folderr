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

import {FastifyRequest, FastifyReply} from 'fastify';
import {Core, Path} from '../../../../internals';

/**
 * @classdesc Fetchs users tokens information (actual token not stored by Folderr)
 */
class Tokens extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API List Tokens';
		this.path = '/account/tokens';

		this.options = {
			schema: {
				response: {
					'4xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'}
						}
					},
					200: {
						type: 'object',
						properties: {
							message: {type: 'array'},
							code: {type: 'number'}
						}
					}
				}
			}
		};
	}

	async execute(request: FastifyRequest, response: FastifyReply) {
		const auth = request.cookies.token
			? await this.Utils.authorization.verifyAccount(request.cookies.token, {
					web: true
			  })
			: await this.Utils.authPassword(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				message: 'Authorization failed',
				code: this.codes.unauth
			});
		}

		const tokens = await this.core.db.findTokens(auth.id);
		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: tokens
				.filter((token) => !token.web)
				.map((token) => ({
					created: token.createdAt.getTime(),
					id: token.id,
					for_user: token.userID,
					description: token.description
				}))
		});
	}
}

export default Tokens;
