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
import {Request, Response} from 'express';
import formidable from 'formidable';
import {join} from 'path';
import {unlinkSync} from 'fs';

/**
 * @classdesc Upload a file
 */
class Image extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Upload Image';
		this.path = '/api/file';
		this.type = 'post';
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

		const name = await this.Utils.genID();
		let file;
		try {
			file = await this.formidablePromise(request);
		} catch (error: unknown) {
			response.status(this.codes.internalErr).json({
				code: this.Utils.FoldCodes.fileParserError,
				message: `Parser error!\n${(error as Error).message}`
			});
			throw new Error((error as Error).message);
		}

		if (!file) {
			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.noFile,
				message: 'Files not parsed/found!'
			});
		}

		if (file.image) {
			file = file.image;
		}

		if (file.file) {
			file = file.file;
		}

		if (!file.type) {
			unlinkSync(file.path);
			return response.status(this.codes.badReq).json({
				code: this.Utils.FoldCodes.fileMimeError,
				message: 'Invalid file!'
			});
		}

		let type = 'image';
		if (file.type.startsWith('video')) {
			type = 'video';
		} else if (!file.type.startsWith('image')) {
			type = 'file';
		}

		let ext = file.path.split('.');
		ext = ext[ext.length - 1];

		await Promise.all([
			this.core.db.makeFile(name, auth.userID, file.path, type),
			this.core.db.updateUser({userID: auth.userID}, {$inc: {files: 1}})
		]);
		return response
			.status(this.codes.ok)
			.send(
				`${
					typeof request.headers?.responseURL === 'string' &&
					auth.cURLs.includes(request.headers.responseURL) &&
					(await this.Utils.testMirrorURL(request.headers.responseURL!))
						? request.headers.responseURL
						: await this.Utils.determineHomeURL(request)
				}/${type[0]}/${name}.${ext as string}`
			);
	}

	private async formidablePromise(request: Request): Promise<any> {
		return new Promise((resolve, reject): formidable.File | void => {
			const path = join(__dirname, '../../../Files/');
			const form = new formidable.IncomingForm({
				uploadDir: path,
				multiples: false,
				keepExtensions: true,
				enabledPlugins: ['multipart']
			});

			form.parse(request, (error: Error, fields: any, files: any) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(files);
			});
		});
	}
}

export default Image;