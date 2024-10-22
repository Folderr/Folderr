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
import childProcess from "child_process";
import util from "util";
import { promises } from "fs";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";

const exec = util.promisify(childProcess.exec);

/**
 * @classdesc Allows the owner to manage the instance
 */
class Manage extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Manage";
		this.path = "/manage";

		this.type = "post";
		this.reqAuth = true;

		this.options = {
			schema: {
				querystring: {
					type: "object",
					properties: {
						type: { type: "string" },
					},
					required: ["type"],
				},
			},
		};
	}

	async execute(
		request: FastifyRequest<{
			Querystring: {
				type: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply | void> {
		const auth = await this.Utils.authPassword(request, (user) =>
			Boolean(user.owner)
		);
		if (!auth || typeof auth === "string") {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		if (request.query.type === "shutdown") {
			this.core.logger.info(
				`System shutdown initiated remotely by owner (${auth.username} - ${auth.id})`
			);
			this.core.shutdownServer(
				"API/Manage/Shutdown",
				"Remote shutdown by owner"
			);
			return response.status(this.codes.ok).send({
				code: this.codes.ok,
				message: "OK",
			});
		}

		if (request.query.type === "update") {
			await response.status(this.codes.accepted).send({
				code: this.codes.ok,
				message: "Attempting update.",
			});
			const file = await promises.readFile("./package.json");
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const oPackage: Record<string, string> = JSON.parse(
				file.toString()
			);
			try {
				await exec("npm run update"); // Eventually make file to handle this
			} catch (error: unknown) {
				if (error instanceof Error) {
					return this.handleError(error, response, undefined, {
						noIncrease: true,
						noResponse: true,
					});
				}

				return;
			}

			const f = await promises.readFile("./package.json");
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const af: Record<string, string> = JSON.parse(f.toString());
			let v;
			const vers = {
				af: Number(af.version.split(".").join(" ")),
				old: Number(oPackage.version.split(".").join(" ")),
			};
			if (vers.af > vers.old) {
				v = `Version upgraded from ${oPackage.version} to ${af.version}`;
			} else if (vers.af === vers.old) {
				v = "Version not changed";
			} else {
				v = `Version downgraded from ${oPackage.version} to ${af.version}`;
			}

			this.core.logger.info(`System updated. ${v}`);
			return;
		}

		return response.status(this.codes.badReq).send({
			code: this.codes.badReq,
			message: "Not an option!",
		});
	}
}

export default Manage;
