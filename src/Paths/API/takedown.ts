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
 * @classdesc Admin endpoint for removing a users content
 */
class Takedown extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Takedown Content';
		this.type = 'delete';
		this.path = '/api/admin/content/:type/:id';

		this.options = {
			schema: {
				params: {
					type: 'object',
					properties: {
						type: {type: 'string'},
						id: {type: 'string'}
					},
					required: ['type', 'id']
				}
			}
		};
	}

	async takedownFile(
		id: string,
		request: FastifyRequest<{
			Params: {
				type: string;
				id: string;
			};
		}>
	): Promise<{
		httpCode: number;
		msg: {
			code: number;
			message: string;
		};
	}> {
		const del = await this.core.db.findAndDeleteFile({id});
		if (!del) {
			return {
				httpCode: this.codes.notAccepted,
				msg: {
					code: this.Utils.FoldCodes.dbNotFound,
					message: 'File not found!'
				}
			};
		}

		await this.core.db.updateUser({id: del.owner}, {$inc: {files: -1}});
		if (this.core.emailer.active) {
			const user = await this.core.db.findUser(
				{id: del.owner},
				'id username email'
			);
			if (!user) {
				return {
					httpCode: this.codes.ok,
					msg: {code: this.codes.ok, message: 'OK'}
				};
			}

			const url = await this.Utils.determineHomeURL(request);
			await this.core.emailer.takedown(
				{
					email: user.email,
					username: user.username,
					id,
					type: del.type
				},
				url
			);
		}

		return {httpCode: this.codes.ok, msg: {code: this.codes.ok, message: 'OK'}};
	}

	async takedownLink(
		id: string,
		request: FastifyRequest<{
			Params: {
				type: string;
				id: string;
			};
		}>
	): Promise<{
		httpCode: number;
		msg: {
			code: number;
			message: string;
		};
	}> {
		const del = await this.core.db.findAndDeleteLink({id});
		if (!del) {
			return {
				httpCode: this.codes.notAccepted,
				msg: {
					code: this.Utils.FoldCodes.dbNotFound,
					message: 'Link not found!'
				}
			};
		}

		await this.core.db.updateUser({id: del.owner}, {$inc: {links: -1}});
		if (this.core.emailer.active) {
			const user = await this.core.db.findUser(
				{id: del.owner},
				'id username email'
			);
			if (!user) {
				return {
					httpCode: this.codes.ok,
					msg: {code: this.codes.ok, message: 'OK'}
				};
			}

			const url = await this.Utils.determineHomeURL(request);
			await this.core.emailer.takedown(
				{
					email: user.email,
					username: user.username,
					id,
					type: 'Link'
				},
				url
			);
		}

		return {httpCode: this.codes.ok, msg: {code: this.codes.ok, message: 'OK'}};
	}

	async execute(
		request: FastifyRequest<{
			Params: {
				type: string;
				id: string;
			};
		}>,
		response: FastifyReply
	) {
		const auth = await this.Utils.authPassword(request, (user: User) =>
			Boolean(user.admin)
		);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed'
			});
		}

		if (
			!request.params?.type ||
			!request.params?.id ||
			!['file', 'link'].includes(request.params.type) ||
			!/^[\dA-Za-z]+$/.test(request.params.id)
		) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: 'Missing or invalid requirements'
			});
		}

		try {
			if (request.params.type === 'file') {
				const out = await this.takedownFile(request.params.id, request);
				return response.status(out.httpCode).send(out.msg);
			}

			const out = await this.takedownLink(request.params.id, request);
			return response.status(out.httpCode).send(out.msg);
		} catch (error: unknown) {
			if (error instanceof Error) {
				return response.status(this.codes.internalErr).send({
					code: this.Utils.FoldCodes.unkownError,
					message: `An error occurred!\n${error.message}`
				});
			}

			this.core.logger.log(
				'fatal',
				`[PATH ${this.label}] Unknown fatal error!`
			);

			return response.status(this.codes.internalErr).send({
				code: this.Utils.FoldCodes.unkownError,
				message: 'An unknown error occurred with this operation!'
			});
		}
	}
}

export default Takedown;
