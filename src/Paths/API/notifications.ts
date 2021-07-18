/**
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
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {Notification} from '../../Structures/Database/db-class';

/**
 * @classdesc Shows all user notifications
 */
class Notifs extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Notifications';
		this.path = '/api/notifications';

		this.type = 'get';
		this.reqAuth = true;

		this.options = {
			schema: {
				querystring: {
					type: 'object',
					properties: {
						admin: {type: 'boolean'}
					}
				}
			}
		};
	}

	async execute(
		request: FastifyRequest<{
			Querystring: {
				admin?: boolean;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check auth by token/id
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Grab the notifications from the user
		// eslint-disable-next-line prefer-destructuring
		let notifs: Notification[] | undefined = auth.notifs;
		// If the user wants to view admin notifications
		if (request.query && request.query.admin === true) {
			// If they arent a admin, they do not get to see these notifications
			if (!auth.admin) {
				return response.status(this.codes.unauth).send({
					code: this.codes.unauth,
					message: 'Authorization failed'
				});
			}

			// Get the notifications, and reset the notifications array
			const anotifs = await this.core.db.findAdminNotifies({});
			notifs = anotifs.map((notification: Notification) => ({
				id: notification.id,
				title: notification.title,
				notify: notification.notify.replace(/\n/g, ','),
				created: notification.created
			}));
		}

		// Return whatever notifications there are
		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: notifs});
	}
}

export default Notifs;
