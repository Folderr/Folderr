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

import Path from '../Structures/path';
import Core from '../Structures/core';
import {Response} from 'express';
import {join} from 'path';
import {Request} from '../Structures/Interfaces/express-extended';

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
	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		if (!request.secure && !this.Utils.verifyInsecureCookies(request)) {
			response
				.status(this.codes.notAccepted)
				.sendFile(join(__dirname, '../Frontend/insecure.html'));
			return;
		}

		if (request.uauth) {
			response.redirect('./');
			return;
		}

		if (!this.core.config.signups) {
			response
				.status(this.codes.notFound)
				.sendFile(join(__dirname, '../Frontend/closed.html'));
			return;
		}

		response.sendFile(join(__dirname, '../Frontend/signups.html'));
	}
}

export default Signup;
