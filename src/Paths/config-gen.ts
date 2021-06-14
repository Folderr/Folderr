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
import {Request} from '../Structures/Interfaces/express-extended';
import {join} from 'path';

class ConfigGen extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Configuration Generator';

		this.path = '/config';
		this.type = 'get';
		this.enabled = false;
	}

	/**
	 * @desc ShareX Configuration Generator Frontend.
	 */
	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		const dir = join(__dirname, '../Frontend/input_token.html');
		if (!request.uauth) {
			response.redirect('/');
			return;
		}

		if (!request.query || !request.query.t) {
			response.sendFile(dir);
			return;
		}

		response.sendFile(join(__dirname, '../Frontend/genConfig.html'));
	}
}

export default ConfigGen;
