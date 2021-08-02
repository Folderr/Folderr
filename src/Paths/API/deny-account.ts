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
import {Core, Path} from '../../internals';

/**
 * @classdesc Admin can deny a users account
 */
class DenyAccount extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Deny Account';

		this.path = '/api/admin/verify';
		this.type = 'delete';
		this.reqAuth = true;

		this.options = {
			schema: {
				body: {
					type: 'object',
					properties: {
						token: {type: 'string'},
						userid: {type: 'string'}
					},
					required: ['token', 'userid']
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
			Body: {
				userid: string;
				token: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check auth by id/token
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Search for the user, and if not found send in an error
		const user = await this.Utils.findVerifying(
			request.body.token,
			request.body.userid
		);
		if (!user) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.FoldCodes.dbNotFound,
				message: 'User not found!'
			});
		}

		// Deny the account & delete notification
		await this.core.db.denyUser(user.id);
		// Log that the account was denied by admin x, and tell the admin the account was denied
		this.core.logger.info(
			`User account denied by administrator (${user.username} - ${user.id})`
		);
		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: 'OK'});
	}
}

export default DenyAccount;
