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
import {Link} from '../../Structures/Database/db-class';
import {RequestGallery} from '../../../types/types/fastify-request-types';

/**
 * @classdesc Allow a user to access their links
 */
class Links extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Links';
		this.path = '/api/links';
		this.reqAuth = true;

		this.options = {
			schema: {
				querystring: {
					type: 'object',
					properties: {
						gallery: {type: 'boolean'},
						limit: {type: 'number'},
						before: {type: 'object'},
						after: {type: 'object'}
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
					200: {
						type: 'object',
						properties: {
							message: {type: 'array'},
							code: {type: 'number'}
						}
					}
				}
			}
		};
	}

	async execute(
		request: FastifyRequest<{
			Querystring: RequestGallery;
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		const generated = this.generatePageQuery(request, auth.id);
		if (generated.errored) {
			const genType = generated as unknown as {
				httpCode: 406;
				json: Record<string, string | number>;
				errored: boolean;
			};
			return response.status(genType.httpCode).send(genType.json);
		}

		const {query, options} = generated as unknown as {
			query: {
				$gt?: {created: Date};
				$lt?: {created: Date};
				owner: string;
			};
			options: {
				sort?: Record<string, unknown>;
				limit?: number;
			};
			errored: boolean;
		};

		const shorts: Link[] = await this.core.db.findLinks(query, options);
		if (!shorts || shorts.length === 0) {
			return response
				.status(this.codes.ok)
				.send({code: this.codes.ok, message: []});
		}

		let url =
			request.headers?.responseURL &&
			typeof request.headers.responseURL === 'string' &&
			auth.cURLs.includes(request.headers.responseURL) &&
			(await this.Utils.testMirrorURL(request.headers.responseURL))
				? request.headers.responseURL
				: await this.Utils.determineHomeURL(request);
		url = url.replace(/\/$/g, '');
		const aShorts = shorts.map((short: Link) => ({
			id: short.id,
			points_to: short.link,
			created: Math.round(short.created.getTime() / 1000),
			link: `${url}/${short.id}`
		}));

		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: aShorts});
	}
}

export default Links;
