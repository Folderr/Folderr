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
import {Core, Path} from '../../../internals';
import {User} from '../../../Structures/Database/db-class';

interface DelReturns {
	code: number;
	mess: {code: number; message: string};
}

/**
 * @classdesc Delete account. Admins can delete others accounts
 */
class DelAccount extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API/User Delete account';
		this.path = '/api/account';
		this.reqAuth = true;

		this.type = 'delete';

		this.options = {
			schema: {
				querystring: {
					type: 'object',
					properties: {
						userid: {type: 'string'}
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
					500: {
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

	/**
	 * @desc Delete the account, separate function to make things be CLEAN
	 * @param auth {UserI} The user deleting the account
	 * @param id {string} The ID of the account that is being deleted
	 * @async
	 * @returns {DelReturns}
	 */
	async deleteAccount(auth: User, id: string): Promise<DelReturns> {
		try {
			// Delete account by uID, and delete their pictures
			await this.core.db.purgeUser(id);
			return {
				code: this.codes.ok,
				mess: {code: this.codes.ok, message: 'Account deleted!'}
			};
		} catch (error: unknown) {
			// If an error occurs, tell the user that an error occured
			const declaredError = error as Error;
			const formattedError = declaredError.message || (error as string);
			this.core.logger.error(
				// eslint disable-next-line max-len
				`[SYSTEM ERROR] - Account deletion failure - ${formattedError}`
			);
			return {
				code: this.codes.internalErr,
				mess: {
					code: this.codes.internalErr,
					message: `Account deletion error - ${formattedError}`
				}
			};
		}
	}

	async execute(
		request: FastifyRequest<{
			Querystring: {
				userid?: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check headers, and check auth
		const auth = await this.Utils.authPassword(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		let out;
		// If you are an admin you can delete someones account by ID
		if (request.query?.userid && typeof request.query.userid === 'string') {
			// If they are not an admin, they arent authorized
			if (!auth.admin) {
				return response.status(this.codes.unauth).send({
					code: this.codes.unauth,
					message: 'Authorization failed.'
				});
			}

			// Find the user, and if not return a not found
			const mem = await this.core.db.findUser({id: request.query.userid});
			if (!mem) {
				return response.status(this.codes.notFound).send({
					code: this.Utils.FoldCodes.dbNotFound,
					message: 'User not found!'
				});
			}

			// Protect the owner and admins from unauthorized account deletions
			if (mem.owner) {
				return response.status(this.codes.forbidden).send({
					code: this.codes.forbidden,
					message: 'You can not delete that account as they are the owner!'
				});
			}

			if (mem.admin && !auth.owner) {
				return response.status(this.codes.forbidden).send({
					code: this.codes.forbidden,
					message: 'You cannot delete another admins account!'
				});
			}

			// Delete the account
			out = await this.deleteAccount(auth, request.query.userid);
			this.core.logger.info(
				`Account ${mem.id} deleted by administrator (${auth.username} - ${auth.id})`
			);
			this.core.addDeleter(request.query.userid);
			return response.status(out.code).send(out.mess);
		}

		// Owner account may never be deleted
		if (auth.owner) {
			return response.status(this.codes.forbidden).send({
				message: 'You can not delete your account as you are the owner!',
				code: this.codes.forbidden
			});
		}

		// Delete the users account
		out = await this.deleteAccount(auth, auth.id);
		this.core.logger.info(`Account ${auth.id} deleted`);

		this.core.addDeleter(auth.id);
		return response.status(out.code).send(out.mess);
	}
}

export default DelAccount;