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

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";
import type { User } from "../../../../Structures/Database/db-class.js";

type DelReturns = {
	code: number;
	mess: { code: number; message: string };
};

/**
 * @classdesc Delete account. Admins can delete others accounts
 */
class DelAccount extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/User Delete account";
		this.path = "/account";
		this.reqAuth = true;

		this.type = "delete";

		this.options = {
			schema: {
				querystring: {
					type: "object",
					properties: {
						userid: { type: "string" },
					},
				},
				// body: {
				//	type: "object",
				//	properties: {
				//		reason: { type: "string" },
				//	},
				// },
				response: {
					/* eslint-disable @typescript-eslint/naming-convention */
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					500: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					200: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
				},
			},
		};
	}
	/* eslint-enable @typescript-eslint/naming-convention */

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
				mess: { code: this.codes.ok, message: "Account deleted!" },
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
					message: `Account deletion error - ${formattedError}`,
				},
			};
		}
	}

	/**
	 * @desc Delete the account, separate function to make things be CLEAN
	 * @param auth {UserI} The user deleting the account
	 * @param id {string} The ID of the account that is being deleted
	 * @async
	 * @returns {DelReturns}
	 */
	async beginDeleteAccount(auth: User, id: string): Promise<DelReturns> {
		try {
			// Delete account by uID, and delete their pictures
			await this.core.db.markUserForDeletion(id);
			this.core.addDeleter(id);
			return {
				code: this.codes.ok,
				mess: {
					code: this.codes.ok,
					message: "Account deletion begun!",
				},
			};
		} catch (error: unknown) {
			// If an error occurs, tell the user that an error occured
			const declaredError = error as Error;
			const formattedError = declaredError.message || (error as string);
			this.core.logger.fatal(
				// eslint disable-next-line max-len
				`[SYSTEM ERROR] - Account deletion failure - ${formattedError}`
			);
			return {
				code: this.codes.internalErr,
				mess: {
					code: this.codes.internalErr,
					message: `Account deletion error - ${formattedError}`,
				},
			};
		}
	}

	async execute(
		request: FastifyRequest<{
			Querystring: {
				userid?: string;
			};
			Body: {
				reason?: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check headers, and check auth
		const needAdmin = typeof request.query.userid === "string";
		const newAuth = await this.Utils.checkAuth(request, needAdmin ?? false);
		if (newAuth.code !== this.codes.ok) {
			return response.status(newAuth.code).send({
				code: newAuth.code,
				message: "Authorization failed.",
			});
		}

		if (needAdmin && !request.body.reason) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Missing reason for account deletion",
			});
		}

		let out;
		// If you are an admin you can delete someones account by ID
		if (needAdmin) {
			// Find the user, and if not return a not found
			const mem = await this.core.db.findUser({
				id: request.query.userid,
			});
			if (!mem) {
				return response.status(this.codes.notFound).send({
					code: this.Utils.foldCodes.dbNotFound,
					message: "User not found!",
				});
			}

			// Protect the owner and admins from unauthorized account deletions
			if (mem.owner) {
				return response.status(this.codes.forbidden).send({
					code: this.codes.forbidden,
					message:
						"You can not delete that account as they are the owner!",
				});
			}

			if (mem.admin && !newAuth.user.owner) {
				return response.status(this.codes.forbidden).send({
					code: this.codes.forbidden,
					message: "You cannot delete another admins account!",
				});
			}

			// Delete the account
			out = await this.deleteAccount(newAuth.user, request.query.userid!);
			this.core.logger.info(
				// eslint-disable-next-line max-len
				`Account ${mem.id} deleted by administrator (${newAuth.user.username} - ${newAuth.user.id})`
			);
			return response.status(out.code).send(out.mess);
		}

		// Owner account may never be deleted
		if (newAuth.user.owner) {
			return response.status(this.codes.forbidden).send({
				message:
					"You can not delete your account as you are the owner!",
				code: this.codes.forbidden,
			});
		}

		// Delete the users account
		out = await this.deleteAccount(newAuth.user, newAuth.user.id);
		this.core.logger.info(`Account ${newAuth.user.id} deleted`);

		return response.status(out.code).send(out.mess);
	}
}

export default DelAccount;
