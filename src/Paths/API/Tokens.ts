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

import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Core from '../../Structures/Core';

/**
 * @classdesc Fetchs users tokens information (actual token not stored by Folderr)
 */
class Tokens extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] List Tokens';
        this.path = '/api/account/tokens';
    }

    async execute(req: Request, res: Response): Promise<Response | void> {
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authPassword(req);
        if (!auth) {
            return res.status(this.codes.unauth).json( { message: 'Authorization failed', code: this.codes.unauth } );
        }
        const tokens = await this.core.db.findTokens(auth.userID);
        return res.status(this.codes.ok).json( {
            code: this.codes.ok, message: tokens.filter(token => !token.web).map(token => {
                // eslint-disable-next-line @typescript-eslint/camelcase
                return { created: Math.round(token.created.getTime() / 1000), id: token.id, for_user: token.userID };
            } ),
        } );
    }
}

export default Tokens;
