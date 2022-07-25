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
import {Core, Path} from '../../../../internals';

/**
 * @classdesc View the admin notification
 */
class Statistics extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API/Admin Statistics';
		this.path = '/admin/statistics';
		this.reqAuth = true;

		this.type = 'get';
		this.options = {
			schema: {
				response: {
					'4xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'},
						},
					},
					'2xx': {
						type: 'object',
						properties: {
							message: {
								type: 'object',
								properties: {
									users: {type: 'number'},
									files: {type: 'number'},
									links: {type: 'number'},
									bannedEmails: {type: 'number'},
									whitelistedEmails: {type: 'number'},
								},
							},
							code: {type: 'number'},
						},
					},
				},
			},
		};
	}

	async execute(
		request: FastifyRequest,
		response: FastifyReply,
	): Promise<FastifyReply> {
		// Check auth
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.',
			});
		}

		const stats = await this.core.db.statistics();

		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: stats});
	}
}

export default Statistics;
