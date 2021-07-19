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

/**
 * @class Allow users to access shortened links
 */
class Short extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Link';
		this.path = ['/link/:id', '/l/:id'];

		this.options = {
			schema: {
				params: {
					type: 'object',
					properties: {
						id: {type: 'string'}
					},
					required: ['id']
				},
				response: {
					'4xx': {
						type: 'string'
					}
				}
			}
		};
	}

	/**
	 * @desc Sends a user to a shortened link.
	 */
	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply | void> {
		if (!request.params || !request.params.id) {
			return response.status(this.codes.badReq).send('Missing short ID');
		}

		const short = await this.core.db.findLink(
			{id: request.params.id},
			'link owner'
		);
		if (!short) {
			return response.status(this.codes.notFound).send('404 Not Found');
		}

		const owner = await this.core.db.findUser({id: short.owner});
		if (!owner) {
			this.core.addDeleter(short.owner);
			return response.status(this.codes.notFound).send('404 Not Found');
		}

		return response.redirect(short.link.trim());
	}
}

export default Short;
