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

import {FastifyRequest, FastifyReply} from 'fastify';
import {Core, Path} from '../../internals';

/**
 * @classsdesc Allows users to remove a mirror
 */
class MirrorRemove extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API/User Mirror Remove';
		this.path = '/api/account/mirror';

		this.type = 'delete';

		this.options = {
			schema: {
				body: {
					type: 'object',
					properties: {
						mirror: {type: 'string'}
					},
					required: ['mirror']
				},
				response: {
					'4xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'}
						}
					},
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

	async execute(
		request: FastifyRequest<{
			Body: {
				mirror: string;
			};
		}>,
		response: FastifyReply
	) {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (auth.cURLs.length === 0 || !auth.cURLs.includes(request.body.mirror)) {
			return response.status(this.codes.badReq).send({
				message: 'Mirror not linked!',
				code: this.Utils.FoldCodes.dbNotFound
			});
		}

		await this.core.db.updateUser(
			{id: auth.id},
			{
				$pullAll: {
					cURLs: request.body.mirror
				}
			}
		);
		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: 'OK'
		});
	}
}

export default MirrorRemove;
