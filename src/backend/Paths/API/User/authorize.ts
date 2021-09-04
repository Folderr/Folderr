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
import {Core, Path} from '../../../internals';
import {User} from '../../../Structures/Database/db-class';

/**
 * @classdesc Allow a user to login
 */
class Login extends Path {
	#sameSite: undefined | 'strict';

	#secure: boolean;

	constructor(core: Core) {
		super(core);
		this.label = 'API/User Authorize';
		this.path = '/api/authorize';
		this.secureOnly = false;

		this.type = 'post';
		this.options = {
			schema: {
				headers: {
					username: {type: 'string'},
					password: {type: 'string'}
				}
			}
		};

		this.#sameSite = 'strict';
		this.#secure = true;
		if (process.env.NODE_ENV === 'dev') {
			this.#secure = false;
			this.#sameSite = undefined;
		}
	}

	async execute(
		request: FastifyRequest<{
			Headers: {
				username: string;
				password: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		let auth: false | User = false;

		try {
			auth = await this.Utils.authPassword(request);
		} catch (error: unknown) {
			this.core.logger.error(error);
		}

		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Set the cookie
		const jwt = await this.core.Utils.authorization.genKeyWeb(auth.id);
		const endTime = new Date(Date.now() + 60 * 60 * 24 * 7 * 2);
		return response
			.cookie('token', jwt, {
				expires: endTime,
				secure: this.#secure,
				httpOnly: true,
				sameSite: this.#sameSite
			})
			.status(this.codes.ok)
			.send({
				code: this.codes.ok,
				message: 'OK'
			});
	}
}

export default Login;
