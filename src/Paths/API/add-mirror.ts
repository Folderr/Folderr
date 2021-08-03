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
import AJV, {JTDSchemaType} from 'ajv/dist/jtd';
import {Core, Path} from '../../internals';

interface MirrorResponse {
	message: {
		res: string;
		token: string;
	};
}

const msgschema: JTDSchemaType<MirrorResponse['message']> = {
	properties: {
		res: {type: 'string'},
		token: {type: 'string'}
	}
};

const schema: JTDSchemaType<MirrorResponse> = {
	properties: {
		message: msgschema
	}
};

const ajv = new AJV();
const parse = ajv.compileParser(schema);

/**
 * @classdesc Add a mirror
 */
class MirrorAdd extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API/User Add Mirror';
		this.path = '/api/account/mirror';

		this.type = 'post';

		this.options = {
			schema: {
				body: {
					type: 'object',
					properties: {
						url: {type: 'string'}
					},
					required: ['url']
				},
				response: {
					'4xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'}
						}
					},
					'5xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'}
						}
					},
					200: {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'}
						}
					}
				}
			}
		};
	}

	async execute(
		request: FastifyRequest<{
			Body: {
				url: string;
			};
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

		if (!/http(s)?:\/\//.test(request.body.url)) {
			return response.status(this.codes.badReq).send({
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
			r = await this.core.got.post<MirrorResponse>(
				`${request.body.url}/api/verify`,
				{
					responseType: 'json',
					parseJson: parse,
					json: {
						url: u,
						owner: auth.id,
						token: out.key
					}
				}
			);
		} catch (error: unknown) {
			if (!error || !(error instanceof Error)) {
				return response.status(this.codes.internalErr).send({
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
				return response.status(this.codes.notAccepted).send({
					code: this.Utils.FoldCodes.mirrorReject,
					message: 'Mirror failed Validation'
				});
			}

			return response.status(this.codes.internalErr).send({
				code: this.Utils.FoldCodes.unkownError,
				message: 'Something unknown happened.'
			});
		}

		if (!r || !r.body) {
			return response.status(this.codes.notAccepted).send({
				code: this.Utils.FoldCodes.mirrorReject,
				message: 'Mirror failed Validation'
			});
		}

		const {message} = r.body;
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
			return response.status(this.codes.notAccepted).send({
				code: this.Utils.FoldCodes.mirrorReject,
				message: 'Mirror failed Validation'
			});
		}

		await this.core.db.updateUser(
			{
				id: auth.id
			},
			{
				$addToSet: {
					cURLs: request.body.url
				}
			}
		);
		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: 'OK'});
	}
}

export default MirrorAdd;
