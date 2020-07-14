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

/**
 * @classdesc SHorten links endpoint
 */
class Shorten extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorten';
        this.path = '/api/link';
        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = req.headers.authorization ? await this.Utils.authorization.verifyAccount(req.headers.authorization) : await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        if (!req.body || !req.body.url) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.short_url_missing, message: 'BODY URL MISSING!' } );
        }
        if (typeof req.body.url !== 'string') {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.short_url_invalid, message: 'URL MUST BE STRING' } );
        }
        try {
            await this.base.superagent.get(req.body.url);
        } catch (err) {
            if (err.code === 'ENOTFOUND') {
                return res.status(this.codes.notFound).json( { code: this.Utils.FoldCodes.short_url_not_found, message: 'URL not found!' } );
            }
        }

        const ID = this.Utils.genID();
        await Promise.all( [this.base.db.makeLink(ID, auth.userID, req.body.url), this.base.db.updateUser( { userID: auth.userID }, { $inc: { links: 1 } } )] );

        this.base.Logger.log('INFO - SHORTS', `User shortened link`, { user: `${auth.username} (${auth.userID})`, url: `${this.base.options.url}/short/${ID}` }, 'shorten', 'Link Shortened');
        return res.status(this.codes.ok).send(`${req.headers?.responseURL && auth.cURLs.includes(req.headers.responseURL) && await this.Utils.testMirrorURL(req.headers.responseURL) ? req.headers.responseURL : await this.Utils.determineHomeURL(req)}/l/${ID}`);
    }
}

export default Shorten;
