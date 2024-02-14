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

import { inspect } from "util";
import process from "process";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../../internals";
import Path from "../../../../Structures/path";

/**
 * @classdesc Allows owner to eval on the instance.
 */
class Eval extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Management Eval";
		this.path = "/eval";
		this.type = "post";
		this.reqAuth = true;
		this.enabled = process.env.NODE_ENV === "dev";

		this.options = {
			schema: {
				body: {
					type: "object",
					properties: {
						eval: { type: "string" },
					},
				},
			},
		};
	}

	async execute(
		request: FastifyRequest<{
			Body: {
				eval: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		const auth = await this.Utils.authPassword(request, (user) =>
			Boolean(user.owner)
		);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		try {
			/* eslint-disable no-eval */
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			let evaled: string | Record<string, unknown> = await eval(
				request.body.eval
			);
			/* eslint-enable no-eval */
			evaled =
				typeof evaled === "object"
					? (evaled = inspect(evaled, { depth: 0, showHidden: true }))
					: (evaled = String(evaled));

			if (!evaled || evaled.length === 0) {
				return await response.status(this.codes.noContent).send({
					code: this.codes.ok,
					message: "",
				});
			}

			const maxLength = 2000; // This limit makes sense.
			if (evaled.length > maxLength) {
				return await response.status(this.codes.ok).send({
					code: this.Utils.foldCodes.evalSizeLimit,
					message: "Eval input too big",
				});
			}

			return await response.status(this.codes.ok).send({
				code: this.codes.ok,
				message: evaled,
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				return response.status(this.codes.badReq).send({
					code: this.Utils.foldCodes.evalError,
					message: `${error.message}`,
				});
			}

			return response.status(this.codes.badReq).send({
				code: this.Utils.foldCodes.evalError,
				message: "Unknown Eval Error. No error object returned.",
			});
		}
	}
}

export default Eval;
