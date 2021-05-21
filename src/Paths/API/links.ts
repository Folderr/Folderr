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

import {Response} from 'express';
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {Link} from '../../Structures/Database/db-class';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Allow a user to access their links
 */
class Links extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Links';
		this.path = '/api/links';
		this.reqAuth = true;
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		const generated = this.generatePageQuery(request, auth.userID);
		if (generated.errored) {
			const genType = generated as unknown as {
				httpCode: number;
				json: Record<string, string|number>;
				errored: boolean;
			};
			return response.status(genType.httpCode).json(genType.json);
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
			return response.status(this.codes.ok).json({code: this.codes.ok, message: []});
		}

		let url = request.headers?.responseURL &&
		typeof request.headers.responseURL === 'string' &&
		auth.cURLs.includes(request.headers.responseURL) &&
		await this.Utils.testMirrorURL(request.headers.responseURL) ?
			request.headers.responseURL :
			await this.Utils.determineHomeURL(request);
		url = url.replace(/\/$/g, '');
		const aShorts = shorts.map((short: Link) => {
			return {
				ID: short.ID,
				points_to: short.link,
				created: Math.round(short.created.getTime() / 1000),
				link: `${url}/${short.ID}`
			};
		});

		return response.status(this.codes.ok).json({code: this.codes.ok, message: aShorts});
	}
}

export default Links;
