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

import Path from '../Structures/path';
import Core from '../Structures/core';
import {Request, Response} from 'express';
import mime from 'mime-types';
import {join} from 'path';

/**
 * @classdesc Allow images to be accessed over the web
 */
class Images extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Images ID';
		this.path = ['/image/:id', '/i/:id'];
	}

	/**
	 * @desc Display an image to the user, or the 404 page if image doesn't exist.
	 */
	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		if (!request.params || !request.params.id) {
			return response
				.status(this.codes.badReq)
				.send('[ERROR] Missing image ID.');
		}

		if (!request.params.id.includes('.')) {
			return response.status(this.codes.badReq).send('Missing file extension!');
		}

		const parts = request.params.id.split('.');
		if (!parts[1]) {
			return response.status(this.codes.badReq).send('Missing file extension!');
		}

		const image = await this.core.db.findFile(
			{ID: parts[0], type: 'image'},
			'type path owner'
		);
		if (image) {
			const owner = await this.core.db.findUser({userID: image.owner});
			if (!owner) {
				this.core.addDeleter(image.owner);
				response
					.status(this.codes.notFound)
					.sendFile(join(__dirname, '../Frontend/notfound.html'));
				return;
			}
		}

		if (!image || (image?.type && image.type !== 'image')) {
			response
				.status(this.codes.notFound)
				.sendFile(join(__dirname, '../Frontend/notfound.html'));
			return;
		}

		let content = mime.contentType(image.path);
		const array = image.path.split('.');
		if (array[array.length - 1] !== parts[1]) {
			return response.status(this.codes.internalErr);
		}

		if (!content) {
			return response.status(this.codes.notFound).send('Image type not found!');
		}

		if (content === image.path) {
			content = `image/${array[array.length - 1].toLowerCase()}`;
		}

		response.setHeader('Content-Type', content);

		response.sendFile(image.path);
	}
}

export default Images;
