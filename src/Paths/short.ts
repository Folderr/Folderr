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
import {Request, Response} from 'express';
import Path from '../Structures/path';
import Core from '../Structures/core';
import {join} from 'path';

/**
 * @class Allow users to access shortened links
 */
class Short extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'Link';
		this.path = ['/link/:id', '/l/:id'];
	}

	/**
	 * @desc Sends a user to a shortened link.
	 */
	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		if (!request.params || !request.params.id) {
			return response
				.status(this.codes.badReq)
				.send('[ERROR] Missing short ID.');
		}

		const short = await this.core.db.findLink(
			{id: request.params.id},
			'link owner'
		);
		if (!short) {
			response
				.status(this.codes.notFound)
				.sendFile(join(__dirname, '../Frontend/notfound.html'));
			return;
		}

		const owner = await this.core.db.findUser({id: short.owner});
		if (!owner) {
			this.core.addDeleter(short.owner);
			response
				.status(this.codes.notFound)
				.sendFile(join(__dirname, '../Frontend/notfound.html'));
			return;
		}

		response.redirect(short.link.trim());
	}
}

export default Short;
