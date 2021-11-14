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
import {AccountReturn} from '../../../../../types/user';

/**
 * @classdesc View the authorized users account
 */
class Account extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API/User View Account';
		this.path = '/account';
		this.reqAuth = true;

		this.type = 'get';

		this.options = {
			schema: {
				response: {
					401: {
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
		request: FastifyRequest,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check headers, and check auth
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Return a nice version of this users account.
		const acc: AccountReturn = {
			username: auth.username,
			id: auth.id,
			admin: auth.admin ?? false,
			owner: auth.owner ?? false,
			files: auth.files,
			links: auth.links,
			email: auth.email,
			pendingEmail: auth.pendingEmail,
			notifications: auth.notifs,
			customUrls: auth.cURLs,
			createdAt: Math.round(auth.createdAt.getTime() / 1000)
		};
		return response
			.status(this.codes.ok)
			.send({message: acc, code: this.codes.ok});
	}
}

export default Account;
