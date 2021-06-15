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

import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {Response} from 'express';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc SHorten links endpoint
 */
class Shorten extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Shorten';
		this.path = '/api/link';
		this.type = 'post';
		this.reqAuth = true;
	}

	async execute(request: Request, response: Response): Promise<Response> {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.body || !request.body.url) {
			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.shortUrlMissing,
				message: 'BODY URL MISSING!'
			});
		}

		if (typeof request.body.url !== 'string') {
			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.shortUrlInvalid,
				message: 'URL MUST BE STRING'
			});
		}

		try {
			await this.core.superagent.get(request.body.url);
			// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
		} catch (error: any) {
			// Force any
			if (error.code === 'ENOTFOUND') {
				return response.status(this.codes.notFound).json({
					code: this.Utils.FoldCodes.shortUrlNotFound,
					message: 'URL not found!'
				});
			}
		}

		const ID = await this.Utils.genID();
		await Promise.all([
			this.core.db.makeLink(ID, auth.id, request.body.url),
			this.core.db.updateUser({id: auth.id}, {$inc: {links: 1}})
		]);

		return response
			.status(this.codes.ok)
			.send(
				`${
					request.headers?.responseURL &&
					typeof request.headers.responseURL === 'string' &&
					auth.cURLs.includes(request.headers.responseURL) &&
					(await this.Utils.testMirrorURL(request.headers.responseURL))
						? request.headers.responseURL
						: await this.Utils.determineHomeURL(request)
				}/l/${ID}`
			);
	}
}

export default Shorten;
