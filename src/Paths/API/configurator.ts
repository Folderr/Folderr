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

import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {Response} from 'express';
import Configurator from '../../Structures/Utilities/sharex-configurator';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Generate a sharex configuration
 */
class ShareXConfigurator extends Path {
	private readonly configurator: Configurator;

	constructor(core: Core) {
		super(core);
		this.label = '[API] Configurator';
		this.path = '/api/sharex/config';
		this.type = 'post';
		this.configurator = new Configurator();
	}

	/**
	 * @desc Generate a ShareX configuration
	 */
	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.body || !request.body.token) {
			return response.status(this.codes.unauth).json({
				code: this.codes.badReq,
				message: 'Missing token in body!'
			});
		}

		const compare = await this.Utils.authorization.verifyAccount(
			request.body.token
		);
		if (!compare) {
			return response.status(this.codes.unauth).json({
				code: this.codes.notAccepted,
				message: 'Invalid Token!'
			});
		}

		const url = await this.Utils.determineHomeURL(request);

		const config = this.configurator.generateFiles(url, request.body.token);
		if (request.query && request.query.d === 'file') {
			response.type('text/plain; charset=binary');
			response.set(
				'Content-Disposition',
				'attachment; filename=Folderr-File-Config.sxcu'
			);
			return response.status(this.codes.ok).send(config[0]);
		}

		if (request.query?.d && request.query.d === 'link') {
			response.type('text/plain; charset=binary');
			response.set(
				'Content-Disposition',
				'attachment; filename=Folderr-Link-Config.sxcu'
			);
			return response.status(this.codes.ok).send(config[1]);
		}

		return response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: config});
	}
}

export default ShareXConfigurator;
