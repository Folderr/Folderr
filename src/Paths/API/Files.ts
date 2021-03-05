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
import Core from '../../Structures/Core';
import { Response } from 'express';
import { Upload } from '../../Structures/Database/DBClass';

/**
 * @classdesc Send users their files
 */
class Files extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Files';
        this.path = '/api/files';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authorization.verifyAccount(req.headers.authorization);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        const query: { $gt?: { created: Date }; $lt?: { created: Date }; owner: string } = { owner: auth.userID };
        const opts: { sort?: object; limit?: number } = req.query?.gallery ? { sort: { created: -1 } } : {};
        const limits = {
            max: 20,
            middle: 15,
            min: 10,
        };
        if (req.query?.gallery) {
            if (req.query?.limit >= limits.max) {
                opts.limit = limits.max;
            } else if (req.query?.limit >= limits.middle) {
                opts.limit = limits.max;
            } else if (req.query?.limit >= limits.min && req.query?.limit < limits.middle) {
                opts.limit = limits.min;
            } else if (req.query?.limit <= limits.min) {
                opts.limit = limits.min;
            } else {
                opts.limit = limits.min;
            }
        } else {
            opts.limit = 20;
        }
        if (req.query?.before) {
            if (req.query.before instanceof Date) {
                query.$lt = { created: req.query.before };
            } else if (req.query.before instanceof Number) {
                query.$lt = { created: new Date(req.query.before) };
            }
        }
        if (req.query?.after) {
            if (req.query.before instanceof Date) {
                query.$gt = { created: req.query.after };
            } else if (req.query.before instanceof Number) {
                query.$gt = { created: new Date(req.query.after) };
            }
        }

        const images: Upload[] = await this.core.db.findFiles(query, opts);
        if (!images) {
            return res.status(this.codes.ok).json( { code: this.codes.noContent, message: [] } );
        }
        let url = req.headers?.responseURL && auth.cURLs.includes(req.headers.responseURL) && await this.Utils.testMirrorURL(req.headers.responseURL) ? req.headers.responseURL : await this.Utils.determineHomeURL(req);
        url = url.replace(/\/$/g, '');
        const files = images.map( (image: Upload) => {
            const split = image.path.split('.');
            const type = split[split.length - 1];
            return { ID: image.ID, type: image.type, created: Math.round(image.created.getTime() / 1000), link: `${url}/${image.type ? image.type[0] : 'i'}/${image.ID}.${type}` };
        } );
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: files } );
    }
}

export default Files;
