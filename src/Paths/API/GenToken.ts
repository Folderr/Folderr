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
import { TokenDB } from '../../Structures/Database/DBClass';
import { Request } from '../../Structures/Interfaces/ExpressExtended';

/**
 * @classdesc Allow a user to generate a token
 */
class GenToken extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Generate Token';
        this.path = '/api/account/token';

        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authPassword(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        const tokens = await this.core.db.findTokens(auth.userID, { web: false } );

        // If the user has their token generated, make sure they know their current token will be gone
        if (tokens.length > 10 && !(req.query && !req.query.override && req.query.override !== 'true') ) {
            return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.tokenSizeLimit, message: 'You have maxed out your tokens! Either delete one or re-request with "?override=true" at the end of the url.' } );
        }
        if (tokens.length >= 10 && (req.query && req.query.override && req.query.override === 'true') ) {
            const tkns = tokens.sort( (a: TokenDB, b: TokenDB) => Number(a.created) - Number(b.created) );
            await this.core.db.purgeToken(tkns[0].id, tkns[0].userID, { web: false } );
        }

        const token = await this.Utils.authorization.genKey(auth.userID);
        return res.status(this.codes.created).json( { code: this.codes.ok, message: token } );
    }
}

export default GenToken;
