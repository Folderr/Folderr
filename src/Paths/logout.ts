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
import {Core, Path} from '../internals';

class Logout extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Logout';
		this.path = '/api/logout';
		this.enabled = !this.core.config.apiOnly;
	}

	/**
	 * @desc Logs you out or displays the deleted account page
	 */
	async execute(request: FastifyRequest, response: FastifyReply) {
		if (!request.cookies.token) {
			return response.redirect('/');
		}

		await this.Utils.authorization.revoke(request.cookies.token, true);
		await response.clearCookie('token', {sameSite: 'strict'});
		return response
			.status(this.codes.ok)
			.send({message: 'Logged out', code: this.codes.ok});
	}
}

export default Logout;
