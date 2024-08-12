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
import { type FastifyReply, type FastifyRequest } from "fastify";
import { type Core } from "../../../internals.js";
import Path from "../../../Structures/path.js";
import Package from "../../../../../package.json" assert { type: "json" };

const exec = util.promisify(childProcess.exec);

/**
 * @classdesc System information such as branch, commit its on, and version
 */
export default class Info extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Authorized Info";
		this.path = "/info";
		this.reqAuth = true;

		this.options = {
			schema: {
				response: {
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					200: {
						type: "object",
						properties: {
							message: { type: "object" },
							code: { type: "number" },
						},
					},
				},
			},
		};
	}

	async execute(
		request: FastifyRequest,
		response: FastifyReply
	): Promise<FastifyReply> {
		const auth = await this.checkAuthAdmin(request);
		if (!auth || typeof auth === "string") {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		const branch = await exec("git branch");
		let actbranch = branch.stdout;
		const arraybranch = actbranch.split("\n");
		for (const b of arraybranch) {
			if (b.startsWith("*")) {
				actbranch = b.slice(2);
				break;
			}
		}

		const vers = await exec("git log -1 --oneline");
		const version = vers.stdout;

		const object = {
			commit: version,
			branch,
			version: Package.version,
		};
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: object });
	}
}
