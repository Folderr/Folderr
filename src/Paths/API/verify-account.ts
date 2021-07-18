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
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {User} from '../../Structures/Database/db-class';

/**
 * @classdesc Administrators verify accounts via this endpoint
 */
class VerifyAccount extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Verify Account';

		this.path = '/api/admin/verify';
		this.type = 'post';
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
				}
			}
		};
	}

	async execute(
		request: FastifyRequest<{
			Body: {
				token: string;
				userid: string;
			};
		}>,
		response: FastifyReply
	) {
		// Handle authorization
		const auth = await this.Utils.authPassword(request, (user: User) =>
			Boolean(user.admin)
		);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Look for the user
		const user = await this.Utils.findVerifying(
			request.body.token,
			request.body.userid
		);
		if (!user) {
			return response.status(this.codes.notAccepted).send({
				code: this.Utils.FoldCodes.dbNotFound,
				message: 'User not found!'
			});
		}

		// Remove the user from verifying schema and add them to the actual user base
		const {username, id} = user;
		await this.core.db.verifyUser(id);

		// Alert the console and the admin that the user was verified
		this.core.logger.info(
			// eslint-disable-next-line max-len
			`User account ${username} (${id}) granted by administrator ${auth.username} (${auth.id})`
		);
		return response
			.status(this.codes.created)
			.send({code: this.codes.ok, message: 'OK'});
	}
}

export default VerifyAccount;
