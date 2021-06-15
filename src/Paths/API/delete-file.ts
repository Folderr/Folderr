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
import {promises as fs, existsSync} from 'fs';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Have a user delete their file
 */
class DeleteFile extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Delete Image';
		this.path = '/api/file/:id';
		this.type = 'delete';
		this.reqAuth = true;
	}

	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).json({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		if (!request.params?.id) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'Missing File ID!'
			});
		}

		const File = await this.core.db.findFile({
			owner: auth.id,
			id: request.params.id
		});
		if (!File) {
			return response.status(this.codes.notFound).json({
				code: this.Utils.FoldCodes.dbNotFound,
				message: 'File not found!'
			});
		}

		await this.core.db.purgeFile({id: File.id, owner: auth.id});
		response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: 'OK'})
			.end();
		if (existsSync(File.path)) {
			await fs.unlink(File.path);
		}
	}
}

export default DeleteFile;
