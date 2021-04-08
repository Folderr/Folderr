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

import { Response } from 'express';
import Path from '../../Structures/Path';
import Core from '../../Structures/Core';
import { Link } from '../../Structures/Database/DBClass';
import { Request } from '../../Structures/Interfaces/ExpressExtended';

/**
 * @classdesc Allow a user to access their links
 */
class Links extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Links';
        this.path = '/api/links';
        this.reqAuth = true;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check auth
        const auth = await this.checkAuth(req);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        const query: { $gt?: { created: Date }; $lt?: { created: Date }; owner: string } = { owner: auth.userID };
        const opts: { sort?: Record<string, unknown>; limit?: number } = req.query?.gallery ? { sort: { created: -1 } } : {};
        const limits = {
            max: 20,
            middle: 15,
            min: 10,
        };
        let limit = req.query?.limit as string | number | undefined;
        if (typeof limit === 'string') {
            try {
                limit = Number(limit);
            } catch (e) {
                this.core.logger.log('debug', e.message);
                return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.unkownError, message: 'An unknown error has occured!' } );
            }
        }
        if (req.query?.gallery && limit && typeof limit === 'number') {
            if (limit >= limits.max) {
                opts.limit = limits.max;
            } else if (limit >= limits.middle) {
                opts.limit = limits.max;
            } else if (limit >= limits.min && limit < limits.middle) {
                opts.limit = limits.min;
            } else if (limit <= limits.min) {
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
            } else if (typeof req.query.before === 'number') {
                query.$lt = { created: new Date(req.query.before) };
            }
        }
        if (req.query?.after) {
            if (req.query.after instanceof Date) {
                query.$gt = { created: req.query.after };
            } else if (typeof req.query.after === 'number') {
                query.$gt = { created: new Date(req.query.after) };
            }
        }

        const shorts: Link[] = await this.core.db.findLinks(query, opts);
        if (!shorts || shorts.length === 0) {
            return res.status(this.codes.ok).json( { code: this.codes.ok, message: [] } );
        }
        let url = req.headers?.responseURL && typeof req.headers.responseURL === 'string' && auth.cURLs.includes(req.headers.responseURL) && await this.Utils.testMirrorURL(req.headers.responseURL) ? req.headers.responseURL : await this.Utils.determineHomeURL(req);
        url = url.replace(/\/$/g, '');
        const aShorts = shorts.map( (short: Link) => {
            // eslint-disable-next-line camelcase
            return { ID: short.ID, points_to: short.link, created: Math.round(short.created.getTime() / 1000), link: `${url}/${short.ID}` };
        } );

        return res.status(this.codes.ok).json( { code: this.codes.ok, message: aShorts } );
    }
}

export default Links;
