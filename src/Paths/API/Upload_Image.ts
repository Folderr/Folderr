/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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

import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import formidable from 'formidable';
import { join } from 'path';
import { unlinkSync } from 'fs';

class Image extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Upload Image';
        this.path = ['/api/upload', '/api/image'];
        this.type = 'post';
        this.reqAuth = true;
    }

    _formidablePromise(req: any): Promise<any> {
        return new Promise( (resolve, reject): formidable.File | void => {
            const path = join(__dirname, '../../Images/');
            const form = new formidable.IncomingForm();
            form.uploadDir = path;
            form.type = 'multipart';
            form.multiples = false;
            form.keepExtensions = true;

            form.parse(req, (err: Error, fields: any, files: any) => {
                if (err) {
                    return reject(err);
                }
                return resolve(files);
            } );
        } );
    }

    async execute(req: any, res: any): Promise<Response|void> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Upload.find();
        const name = this.Utils.genID(images);
        let file;
        try {
            file = await this._formidablePromise(req);
        } catch (err) {
            res.status(this.codes.internalErr).send(`[ERROR] Parser error!\n${err}`);
            throw Error(err);
        }

        if (!file) {
            return res.status(this.codes.badReq).send('[ERROR] Files not parsed/found!');
        }
        if (!file.image.type) {
            unlinkSync(file.image.path);
            return res.status(this.codes.badReq).send('[ERROR] Invalid file/image/video!');
        }
        let type = 'image';
        if (file.image.type.startsWith('video') ) {
            type = 'video';
        } else if (!file.image.type.startsWith('image') ) {
            type = 'file';
        }
        if (file.image.type.includes('html') || file.image.type.includes('ecmascript' || 'javascript') ) {
            unlinkSync(file.image.path);
            return res.status(this.codes.badReq).send('[ERROR] Forbidden MIME type.');
        }

        let ext = file.image.path.split('.');
        ext = ext[ext.length - 1];

        // console.log(`[INFO - IMAGES] Image ${this.base.options.url}/images/${name}.${ext} added!`);
        this.base.Logger.log('INFO - IMAGES', `Upload uploaded by ${auth.username} (${auth.uID})!`, { imageURL: `${this.base.options.url}/${type}s/${name}.${ext}` }, 'imageUpload', 'Upload Uploaded');

        const image = new this.base.schemas.Upload( { ID: name, owner: auth.uID, path: file.image.path, type } );
        await image.save();
        return res.status(this.codes.ok).send(`${auth.cUrl || this.base.options.url}/${type}s/${name}.${ext}`);
    }
}

export default Image;
