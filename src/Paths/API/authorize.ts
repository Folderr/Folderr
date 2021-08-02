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

import {FastifyReply, FastifyRequest} from 'fastify';
import {Core, Path} from '../../internals';

/**
 * @classdesc Allow a user to login
 */
class Login extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Authorize';
		this.path = '/api/authorize';
		this.secureOnly = false;

		this.type = 'post';
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
							message: {type: 'string'},
							code: {type: 'number'}
						}
					}
				}
			}
		};
	}

	async execute(
		request: FastifyRequest,
		response: FastifyReply
	): Promise<FastifyReply> {
		if (
			!request.headers ||
			(request.headers &&
				(!request.headers.username || !request.headers.password))
		) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: 'MISSING DETAIL(S)'
			});
		}

		const auth = await this.Utils.authPassword(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Set the cookie to expire in a weeks time
		const week = 604_800_000;
		const endTime = new Date(Date.now() + week * 2);
		const jwt = await this.core.Utils.authorization.genKeyWeb(auth.id);
		return response
			.cookie('token', jwt, {
				expires: endTime,
				secure: false,
				httpOnly: true,
				sameSite: 'strict'
			})
			.status(this.codes.ok)
			.send({
				code: this.codes.ok,
				message: 'OK'
			});
	}
}

export default Login;
