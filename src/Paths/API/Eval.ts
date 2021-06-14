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
import {inspect} from 'util';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Allows owner to eval on the instance.
 */
class Eval extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Eval';
		this.path = '/api/eval';
		this.type = 'post';
		this.reqAuth = true;
		this.enabled = process.env.NODE_ENV === 'dev';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		const auth = await this.Utils.authPassword(request, (user) =>
			Boolean(user.first)
		);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.body || !request.body.eval) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Eval code not provided.'
			});
		}

		try {
			// eslint-disable-next-line no-eval
			let evaled = await eval(request.body.eval);
			evaled =
				typeof evaled === 'object'
					? (evaled = inspect(evaled, {depth: 0, showHidden: true}))
					: (evaled = String(evaled));

			if (!evaled || evaled.length === 0) {
				return response.status(this.codes.noContent).json({
					code: this.codes.ok,
					message: ''
				});
			}

			const maxLength = 2000; // This limit makes sense.
			if (evaled.length > maxLength) {
				return response.status(this.codes.ok).json({
					code: this.Utils.FoldCodes.evalSizeLimit,
					message: 'Eval input too big'
				});
			}

			return response.status(this.codes.ok).json({
				code: this.codes.ok,
				message: evaled
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				return response.status(this.codes.badReq).json({
					code: this.Utils.FoldCodes.evalError,
					message: `${error.message}`
				});
			}

			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.evalError,
				message: 'Unknown Eval Error. No error object returned.'
			});
		}
	}
}

export default Eval;
