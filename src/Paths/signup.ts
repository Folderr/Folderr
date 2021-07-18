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

import {join} from 'path';
import {FastifyReply, FastifyRequest} from 'fastify';
import Path from '../Structures/path';
import Core from '../Structures/core';

class Signup extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Sign up';
		this.path = '/signup';
		this.enabled = false;
	}

	/**
	 * @desc Displays the signup page for signed out users.
	 */
	async execute(request: FastifyRequest, response: FastifyReply) {
		if (
			request.protocol !== 'https' &&
			!this.Utils.verifyInsecureCookies(request)
		) {
			return response
				.status(this.codes.notAccepted)
				.sendFile(join(process.cwd(), './Frontend/insecure.html'));
		}

		if (request.cookies.token) {
			return response.redirect('./');
		}

		if (!this.core.config.signups) {
			return response
				.status(this.codes.notFound)
				.sendFile(join(process.cwd(), './Frontend/closed.html'));
		}

		return response.sendFile(join(process.cwd(), './Frontend/signups.html'));
	}
}

export default Signup;
