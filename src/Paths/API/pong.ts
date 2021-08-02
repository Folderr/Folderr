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

import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import {FastifyReply, FastifyRequest} from 'fastify';
import {Core, Path} from '../../internals';
import pkg from '../../../package.json';

// @ts-expect-error
momentDurationFormatSetup(moment);

/**
 * @classdesc Shows overall information
 */
class Pong extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Pong';
		this.path = '/api/';
		this.type = 'get';

		this.options = {
			schema: {
				response: {
					200: {
						type: 'object',
						properties: {
							message: {type: 'object'},
							code: {type: 'number'}
						}
					}
				}
			}
		};
	}

	/**
	 * @desc PONG! Just a simple response, no auth needed
	 */
	async execute(
		request: FastifyRequest,
		response: FastifyReply
	): Promise<FastifyReply> {
		const out: {
			message: {
				version: string;
				node_version: string;
				online_since: number;
				message: string;
			};
			code: number;
		} = {
			message: {
				version: pkg.version,
				node_version: process.version,
				online_since: new Date(Date.now() - process.uptime() * 1000).getTime(),
				message: 'Pong!'
			},
			code: this.codes.ok
		};
		return Promise.resolve(response.status(this.codes.ok).send(out));
	}
}

export default Pong;
