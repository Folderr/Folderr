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
import Path from "../../../../Structures/path";
import type { Core } from "../../../../internals";

/**
 * @classdesc Allow users to verify themselves
 */
class Verify extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "Verify Self";
		this.path = "/verify/:userid/:token";
		this.type = "POST";
		this.enabled =
			process.env.NODE_ENV === "dev"
				? true
				: this.core.config.signups === 2;

		this.options = {
			schema: {
				params: {
					type: "object",
					properties: {
						userid: { type: "string" },
						token: { type: "string" },
					},
					required: ["userid", "token"],
				} /* eslint-disable @typescript-eslint/naming-convention */,
				response: {
					200: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
				},
			} /* eslint-enable @typescript-eslint/naming-convention */,
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
		if (!request.params.userid || !request.params.token) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Missing requirements!",
			});
		}

		if (!this.Utils.isValidFolderrId(request.params.userid)) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Malformed or otherwise invalid ID",
			});
		}

		const verify = await this.Utils.findVerifying(
			request.params.token,
			request.params.userid
		);
		if (!verify) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "User not found!",
			});
		}

		const expiresAfter = 172_800_000; // 48H in MS
		const timeSinceCreation = Date.now() - Number(verify.createdAt);
		if (timeSinceCreation >= expiresAfter) {
			await this.core.db.denySelf(verify.id);
			return response.status(this.codes.notAccepted).send({
				code: this.Utils.foldCodes.userDenied,
				message: "Validation time expired.",
			});
		}

		await this.core.db.verifySelf(verify.id);

		this.core.logger.info("User account verified by self");
		const resp = await response
			.status(this.codes.created)
			.send({ code: this.codes.ok, message: "OK" });

		if (this.core.emailer.active) {
			try {
				await this.core.emailer.welcomeEmail(
					verify.email,
					verify.email,
					this.core.config.url
				);
			} catch (error: unknown) {
				if (error instanceof Error) {
					this.core.logger.error(error, error.message);
				}

				this.core.logger.error(error, "Unknown error occurred");
			}
		}

		return resp;
	}
}

export default Verify;
