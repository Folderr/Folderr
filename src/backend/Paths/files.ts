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

import mime from 'mime-types';
import {FastifyReply, FastifyRequest} from 'fastify';
import {Core, Path} from '../internals';

/**
 * @classdesc Allow files to be accessed over the web
 */
class Files extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Get file by id';
		this.path = ['/file/:id', '/f/:id'];

		this.options = {
			schema: {
				params: {
					type: 'object',
					properties: {
						id: {type: 'string'}
					},
					required: ['id']
				},
				response: {
					'4xx': {
						type: 'string'
					}
				}
			}
		};
	}

	/**
	 * @desc Display an image to the user, or the 404 page if image doesn't exist.
	 */
	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply | void> {
		if (!request.params || !request.params.id) {
			return response.status(this.codes.badReq).send('Missing file ID');
		}

		if (!request.params.id.includes('.')) {
			return response.status(this.codes.badReq).send('Missing file extension!');
		}

		const parts = request.params.id.split('.');
		if (!parts[1]) {
			return response.status(this.codes.badReq).send('Missing file extension!');
		}

		const image = await this.core.db.findFile(
			{id: parts[0]},
			'path type owner'
		);
		if (image) {
			const owner = await this.core.db.findUser({id: image.owner});
			if (!owner) {
				this.core.addDeleter(image.owner);
				return response.status(this.codes.notFound).send('404 Not Found');
			}
		}

		if (!image || (image?.type && image.type !== 'file')) {
			return response.status(this.codes.notFound).send('404 Not Found');
		}

		let content = mime.contentType(image.path);
		const array = image.path.split('.');
		if (array[array.length - 1] !== parts[1]) {
			return response.status(this.codes.internalErr);
		}

		if (!content) {
			return response.status(this.codes.notFound).send('File type not found!');
		}

		if (!array[array.length - 1].includes('html')) {
			if (content === image.path) {
				content = `text/${array[array.length - 1].toLowerCase()}`;
			}

			await response.header('Content-Type', content);
		}

		return response.sendFile(image.path);
	}
}

export default Files;
