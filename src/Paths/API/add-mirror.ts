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
import {Response, Request} from 'express';

/**
 * @classdesc Add a mirror
 */
class MirrorAdd extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Add Mirror';
		this.path = '/api/account/mirror';

		this.type = 'post';
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

		if (
			!request.body ||
			!request.body.url ||
			typeof request.body.url !== 'string' ||
			!/http(s)?:\/\//.test(request.body.url)
		) {
			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.mirrorInvalidUrl,
				message: 'Invalid Mirror URL'
			});
		}

		let r;
		let id;
		let u;
		try {
			u = await this.Utils.determineHomeURL(request);
			const out = await this.Utils.authorization.genMirrorKey(
				u,
				request.body.url
			);
			id = out.id;
			r = await this.core.superagent
				.get(`${request.body.url as string}/api/verify`)
				.send({
					url: u,
					owner: auth.userID,
					token: out.key
				});
		} catch (error: unknown) {
			if (!error || !(error instanceof Error)) {
				return response.status(this.codes.internalErr).json({
					code: this.Utils.FoldCodes.unkownError,
					message: 'Unknown error occured'
				});
			}

			if (
				error &&
				error instanceof Error &&
				error.message &&
				/Not Found|\[FAIL]/.test(error.message)
			) {
				return response.status(this.codes.notAccepted).json({
					code: this.Utils.FoldCodes.mirrorReject,
					message: 'Mirror failed Validation'
				});
			}

			return response.status(this.codes.internalErr).json({
				code: this.Utils.FoldCodes.unkownError,
				message: 'Something unknown happened.'
			});
		}

		const out = r.text;
		if (!out) {
			return response.status(this.codes.notAccepted).json({
				code: this.Utils.FoldCodes.mirrorReject,
				message: 'Mirror failed Validation'
			});
		}

		const nOut = JSON.parse(out);
		const {message} = nOut;
		const valid =
			id && u
				? this.Utils.authorization.verifyMirrorKey(
						message,
						id,
						u,
						request.body.url
				  )
				: false;
		if (!valid) {
			return response.status(this.codes.notAccepted).json({
				code: this.Utils.FoldCodes.mirrorReject,
				message: 'Mirror failed Validation'
			});
		}

		await this.core.db.updateUser(
			{
				userID: auth.userID
			},
			{
				$addToSet: {
					cURLs: request.body.url
				}
			}
		);
		return response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: 'OK'});
	}
}

export default MirrorAdd;
