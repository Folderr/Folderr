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

class Shorten extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorten';
        this.path = '/api/short';
        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        if (!req.body || !req.body.url) {
            return res.status(this.codes.badReq).send('[ERROR] BODY URL MISSING!');
        }
        if (typeof req.body.url !== 'string') {
            return res.status(this.codes.badReq).send('[ERROR] URL MUST BE STRING');
        }
        try {
            await this.base.superagent.get(req.body.url);
        } catch (err) {
            if (err.code === 'ENOTFOUND') {
                return res.status(this.codes.notFound).send('[ERROR] URL not found!');
            }
        }

        const links = await this.base.schemas.Shorten.find( { owner: auth.uID } );
        const ID = this.Utils.genID(links);
        const short = new this.base.schemas.Shorten( { ID, owner: auth.uID, link: req.body.url } );

        await short.save();
        this.base.Logger.log('INFO - SHORTS', `User shortened link`, { user: `${auth.username} (${auth.uID})`, url: `${this.base.options.url}/short/${ID}` }, 'shorten', 'Link Shortened');
        return res.status(this.codes.created).send(`${this.base.options.url}/short/${ID}`);
    }
}

export default Shorten;
