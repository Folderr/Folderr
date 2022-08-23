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

import process from 'process';
import {join} from 'path';
import {createWriteStream} from 'fs';
import {promisify} from 'util';
import {pipeline} from 'stream';
import {unlink} from 'fs/promises';
import {FastifyRequest, FastifyReply} from 'fastify';
import {Core, Path} from '../../../../internals';

const pump = promisify(pipeline);

const dir = join(process.cwd(), './Files/');

/**
 * @classdesc Upload a file
 */
class Image extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API Upload File';
		this.path = '/file';
		this.type = 'post';
		this.reqAuth = true;

		this.options = {
			schema: {
				response: {
					'4xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'},
						},
					},
					500: {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'},
						},
					},
					200: {
						type: 'string',
					},
				},
			},
		};
	}

	async execute(request: FastifyRequest, response: FastifyReply) {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.',
			});
		}

		const file = await request.file();

		if (!file || !file.file) {
			return response.status(this.codes.badReq).send({
				code: this.Utils.FoldCodes.noFile,
				message: 'File not found!',
			});
		}

		const ext = file.filename.split('.');
		const fext = ext[ext.length - 1];
		const name = await this.Utils.genID();

		try {
			await pump(file.file, createWriteStream(`${dir}/${name}.${fext}`));
		} catch (error: unknown) {
			if (
				error instanceof this.core.app.multipartErrors.RequestFileTooLargeError
			) {
				await unlink(`${dir}/${name}.${fext}`);
				return response.status(this.codes.badReq).send({
					code: this.Utils.FoldCodes.fileSizeLimit,
					message: 'File is over size. Max size is 1GB',
				});
			}

			return response.status(this.codes.internalErr).send({
				code: this.Utils.FoldCodes.fileParserError,
				message: `Parser error!\n${
					error instanceof Error ? error.message : (error as string)
				}`,
			});
		}

		if (file.file.truncated) {
			await unlink(`${dir}/${name}.${fext}`);
			return response.status(this.codes.badReq).send({
				code: this.Utils.FoldCodes.fileSizeLimit,
				message: 'File is over size. Max size is 1GB',
			});
		}

		if (!file.mimetype) {
			await unlink(`${dir}/${name}.${fext}`);
			return response.status(this.codes.badReq).send({
				code: this.Utils.FoldCodes.fileMimeError,
				message: 'Invalid file!',
			});
		}

		let type = 'image';
		if (file.mimetype.startsWith('video')) {
			type = 'video';
		} else if (!file.mimetype.startsWith('image')) {
			type = 'file';
		}

		try {
			await Promise.all([
				this.core.db.makeFile(name, auth.id, `${dir}/${name}.${fext}`, {
					generic: type,
					mimetype: file.mimetype,
				}),
				this.core.db.updateUser({id: auth.id}, {$inc: {files: 1}}),
			]);
		} catch (error: unknown) {
			console.log(error);
		}

		return response
			.status(this.codes.ok)
			.send(
				`${
					typeof request.headers?.responseURL === 'string' &&
					auth.cURLs.includes(request.headers.responseURL) &&
					(await this.Utils.testMirrorURL(request.headers.responseURL!))
						? request.headers.responseURL
						: await this.Utils.determineHomeURL(request)
				}/${type[0]}/${name}.${fext}`,
			);
	}
}

export default Image;
