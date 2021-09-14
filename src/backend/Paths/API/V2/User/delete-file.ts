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
 * @classdesc Have a user delete their file
 */
class DeleteFile extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API Delete Image';
		this.path = '/file/:id';
		this.type = 'delete';
		this.reqAuth = true;

		this.options = {
			schema: {
				params: {
					type: 'object',
					properties: {
						id: {type: 'string'}
					}
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
							message: {type: 'string'},
							code: {type: 'number'}
						}
					}
				}
			}
		};
	}

	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.params.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: 'Missing File ID!'
			});
		}

		const File = await this.core.db.findFile({
			owner: auth.id,
			id: request.params.id
		});
		if (!File) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.FoldCodes.dbNotFound,
				message: 'File not found!'
			});
		}

		await this.core.db.purgeFile({id: File.id, owner: auth.id});
		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: 'OK'});
	}
}

export default DeleteFile;
