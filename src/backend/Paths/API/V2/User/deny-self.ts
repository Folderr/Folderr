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
 * @classdesc Allow a user to deny the creation of their account
 */
class Deny extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Deny Self';
		this.path = '/deny/:userid/:token';
		this.enabled = this.core.emailer.active && this.core.config.signups === 2;

		this.options = {
			schema: {
				params: {
					type: 'object',
					properties: {
						userid: {type: 'string'},
						token: {type: 'string'}
					},
					required: ['userid', 'token']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'}
						}
					},
					'4xx': {
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
				userid: string;
				token: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		if (!request.params?.userid || !request.params?.token) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: 'Missing requirements!'
			});
		}

		const verify = await this.Utils.findVerifying(
			request.params.token,
			request.params.userid
		);
		if (!verify) {
			return response.status(this.codes.badReq).send({
				code: this.Utils.FoldCodes.dbNotFound,
				message: 'User not found!'
			});
		}

		await this.core.db.denySelf(verify.id);
		return response
			.status(this.codes.created)
			.send({code: this.codes.ok, message: 'OK'});
	}
}

export default Deny;
