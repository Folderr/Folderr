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

		// Folderr no longer uses cookies.
		const jwt = await this.core.Utils.authorization.genKeyWeb(auth.id);
		return response.send({code: this.codes.ok, message: jwt});
	}
}

export default Login;
