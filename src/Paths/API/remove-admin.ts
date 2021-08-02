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
 * @classdesc Remove an administrators admin status
 */
class RemoveAdmin extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Remove Admin';
		this.path = '/api/manage/admin/:id';
		this.reqAuth = true;

		this.type = 'delete';

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
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Actually check auth, and make sure they are the owner
		const auth = await this.Utils.authPassword(request, (user) =>
			Boolean(user.owner)
		);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		const match = /^\d+$/.exec(request.params.id);
		if (!match || match[0].length !== request.params.id.length) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: 'ID is not a valid Folderr ID!'
			});
		}

		const user = await this.core.db.findAndUpdateUser(
			{
				id: request.params.id,
				$nor: [{admin: false}, {first: true}]
			},
			{admin: false},
			'admin'
		);
		if (!user) {
			return response.status(this.codes.notFound).send({
				message: 'User not found!',
				code: this.Utils.FoldCodes.dbNotFound
			});
		}

		if (user.admin) {
			return response.status(this.codes.notAccepted).send({
				message: 'Update fail!',
				code: this.Utils.FoldCodes.dbUnkownError
			});
		}

		const responsible = `${auth.username} (${auth.id})`;
		const formerAdmin = `${user.username} (${user.id})`;
		this.core.logger.info(
			`Administator removed for ${formerAdmin} by ${responsible}`
		);
		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: 'OK'
		});
	}
}

export default RemoveAdmin;
