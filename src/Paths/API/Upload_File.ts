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

import Path from '../../Structures/Path';
import Folderr from '../../Structures/Folderr';
import Base from '../../Structures/Base';
import { Response } from 'express';
import formidable from 'formidable';
import { join } from 'path';
import { unlinkSync } from 'fs';
import { WebhookExecOptions } from '../../Structures/DiscordWebhookHandler';

class Image extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Upload Image';
        this.path = '/api/file';
        this.type = 'post';
        this.reqAuth = true;
    }

    _formidablePromise(req: any): Promise<any> {
        return new Promise( (resolve, reject): formidable.File | void => {
            const path = join(__dirname, '../../../Files/');
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
        const auth = !req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.headers.authorization) : await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        const name = this.Utils.genID();
        let file;
        try {
            file = await this._formidablePromise(req);
        } catch (err) {
            res.status(this.codes.internalErr).json( { code: this.Utils.FoldCodes.file_parse_error, message: `Parser error!\n${err}` } );
            throw Error(err);
        }
        console.log(file.file);

        if (!file) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.no_file, message: 'Files not parsed/found!' } );
        }
        if (file.image) {
            console.log(file.image);
            file = file.image;
        }
        if (file.file) {
            file = file.file; // Cannot destructure
        }
        if (!file.type) {
            unlinkSync(file.path);
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.file_mime_error, message: 'Invalid file!' } );
        }
        let type = 'image';
        if (file.type.startsWith('video') ) {
            type = 'video';
        } else if (!file.type.startsWith('image') ) {
            type = 'file';
        }
        if (file.type.includes('html') || file.type.includes('ecmascript' || 'javascript') ) {
            unlinkSync(file.path);
            return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.file_forbidden_mime, message: 'Forbidden MIME type.' } );
        }

        let ext = file.path.split('.');
        ext = ext[ext.length - 1];
        if (/exe|sh|bat/.test(ext) ) {
            unlinkSync(file.image.path);
            return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.file_forbidden_mime, message: 'Forbidden MIME type.' } );
        }

        const opts: WebhookExecOptions = { imageURL: `${this.base.options.url}/${type[0]}/${name}.${ext}` };
        if (type !== 'image') {
            opts.url = opts.imageURL;
            opts.imageURL = undefined;
        }
        this.base.Logger.log('INFO - FILES', `File uploaded by ${auth.username} (${auth.userID})!`, opts, 'fileUpload', 'File Uploaded');

        await Promise.all( [this.base.db.makeFile(name, auth.userID, file.path, type), this.base.db.updateUser( { userID: auth.userID }, { $inc: { files: 1 } } )] );
        return res.status(this.codes.ok).send(`${req.headers?.responseURL && auth.cURLs.includes(req.headers.responseURL) && await this.Utils.testMirrorURL(req.headers.responseURL) ? req.headers.responseURL : await this.Utils.determineHomeURL(req)}/${type[0]}/${name}.${ext}`);
    }
}

export default Image;
