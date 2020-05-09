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

import Path from '../Structures/Path';
import Folderr from '../Structures/Folderr';
import Base from '../Structures/Base';
import { Response } from 'express';
import mime from 'mime-types';
import { join } from 'path';

class Videos extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Videos ID';
        this.path = ['/videos/:id', '/v/:id'];
    }

    /**
     * @desc Display an image to the user, or the 404 page if image doesn't exist.
     */
    async execute(req: any, res: any): Promise<Response | void> {
        if (!req.params || !req.params.id) {
            return res.status(this.codes.badReq).send('[ERROR] Missing video ID.');
        }
        if (!req.params.id.match('.') ) {
            return res.status(this.codes.badReq).send('Missing file extension!');
        }
        const parts = req.params.id.split('.');
        if (!parts[1] ) {
            return res.status(this.codes.internalErr).send('500 Internal Error');
        }
        const image = await this.base.db.findFile( { ID: parts[0] } );
        if (image) {
            const owner = await this.base.db.findUser( { userID: image.owner } );
            if (!owner) {
                this.base.addDeleter(image.owner);
                return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/notfound.html') );
            }
        }
        if (!image || (image && image.type && image.type !== 'video') ) {
            return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/notfound.html') );
        }
        let content = mime.contentType(image.path);
        const arr = image.path.split('.');
        if (arr[arr.length - 1] !== parts[1] ) {
            return res.status(this.codes.internalErr);
        }
        if (!content) {
            return res.status(this.codes.notFound).send('Video type not found!');
        }
        if (content !== image.path) {
            res.setHeader('Content-Type', content);
        } else {
            content = `video/${arr[arr.length - 1].toLowerCase()}`;
            res.setHeader('Content-Type', content);
        }


        return res.sendFile(image.path);
    }
}

export default Videos;
