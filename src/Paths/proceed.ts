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
import Path from '../Structures/path';
import Core from '../Structures/core';

class Proceed extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Proceed Security Check';

		this.path = '/proceed';
		this.type = 'get';
		this.enabled = !this.core.config.apiOnly;
	}

	/**
	 * @desc Allows the user to make insecure requests, for 30 minutes.
	 */
	async execute(
		request: FastifyRequest,
		response: FastifyReply
	): Promise<FastifyReply | void> {
		const r = request.headers.referer;
		if (!r) {
			return response.redirect('/');
		}

		const mins = 1_800_000;
		const endTime = new Date(Date.now() + mins);
		return response
			.cookie('i', 't', {
				expires: endTime,
				secure: false,
				sameSite: 'strict',
				httpOnly: true
			})
			.redirect(`${r}`);
	}
}

export default Proceed;
