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

import moment from "moment";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../../internals";
import Path from "../../../../Structures/path";

/**
 * @classdesc User can delete a single notification
 */
class DelNotify extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/User Delete notification";
		this.path = "/notification/:id";

		this.type = "delete";
		this.reqAuth = true;

		this.options = {
			schema: {
				params: {
					type: "object",
					properties: {
						id: { type: "string" },
					},
					required: ["id"],
				},
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

	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === "string") {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		// Check query
		if (!request.params?.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Missing notification ID",
			});
		}

		// Grab the users notifications, and find the one they are looking for
		const { notifs } = auth;
		if (!notifs) {
			return response.status(this.codes.notFound).send({
				code: this.codes.notFound,
				message: "You have no notifications!",
			});
		}

		const notify = notifs.find(
			(notification) => notification.id === request.params.id
		);
		// If no notification, tell the user that notification does not exist
		if (!notify) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "Notification not found!",
			});
		}

		// Days * hours/day * minutes/hour * seconds/minute * milliseconds/second
		const breakdown = {
			days: 90,
			hoursPerDay: 24,
			minutesPerHour: 60,
			secondsPerMinute: 60,
			msPerSecond: 1000,
		};
		let limit = 0;
		for (const setLimit of Object.values(breakdown)) {
			if (Number.isNaN(limit)) {
				return response.status(this.codes.internalErr).send({
					code: this.codes.internalErr,
					message: "Internal Math Error",
				});
			}

			limit *= setLimit;
		}

		if (
			notify?.title === "Warn" &&
			Date.now() - notify.createdAt.getTime() < limit
		) {
			const time = new Date(Date.now() + limit).getTime() - Date.now();
			const formattedTime = moment
				.duration(time)
				.format(
					"M [Months], D [Days], H [Hours], m [Minutes, and] s [Seconds]"
				);
			return response.status(this.codes.forbidden).send({
				code: this.codes.forbidden,
				message: `Notification cannot be deleted for ${formattedTime}`,
			});
		}

		// Remove the notification, update the users account, and return success
		await this.core.db.updateUser(
			{ id: auth.id },
			{
				$pull: {
					notifs: {
						id: request.params.id,
					},
				},
			}
		);
		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: "OK",
		});
	}
}

export default DelNotify;
