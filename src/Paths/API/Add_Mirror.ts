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

/**
 * @classdesc Add a mirror
 */
class MirrorAdd extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Add Mirror';
        this.path = '/api/account/mirror';

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = !req.cookies && !req.cookies.token ? await this.Utils.authorization.verifyAccount(req.headers.authorization) : await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        if (!req.body || !req.body.url || !/http(s)?:\/\//.test(req.body.url) ) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.mirror_invalid_url, message: 'Invalid Mirror URL' } );
        }
        let r,
            id,
            u;
        try {
            u = await this.Utils.determineHomeURL(req);
            const out = await this.Utils.authorization.genMirrorKey(u, req.body.url);
            // eslint-disable-next-line prefer-destructuring
            id = out.id;
            r = await this.core.superagent.get(`${req.body.url}/api/verify`).send( { url: u, owner: auth.userID, token: out.key } );
        } catch (e) {
            if (e.message && (e.message.match('Not Found') || e.message.match('[FAIL]') ) ) {
                return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.mirror_reject, message: 'Mirror failed Validation' } );
            }
            return res.status(this.codes.internalErr).json( { code: this.Utils.FoldCodes.unknown_error, message: 'Something unknown happened.' } );
        }
        const out = r.text;
        if (!out) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.mirror_reject, message: 'Mirror failed Validation' } );
        }
        const nOut = JSON.parse(out);
        const { message } = nOut;
        const valid = id && u ? this.Utils.authorization.verifyMirrorKey(message, id, u, req.body.url) : false;
        if (!valid) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.mirror_reject, message: 'Mirror failed Validation' } );
        }
        await this.core.db.updateUser( { userID: auth.userID }, { $addToSet: { cURLs: req.body.url } } );
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default MirrorAdd;
