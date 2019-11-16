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
import Base from '../../Structures/Base';
import Evolve from '../../Structures/Evolve';
import { Response } from 'express';
import { UserI } from '../../Schemas/User';

class VEXRAdd extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/vexr';

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        if (!req.body || !req.body.url || !req.body.url.startsWith('http') ) {
            return res.status(this.codes.badReq).send('[ERROR] Invalid VEXR URL');
        }
        let r;
        try {
            let u = this.base.options.url;
            if (u === 'localhost') {
                u += `:${this.base.options.port}`;
            }
            r = await this.base.superagent.get(`${req.body.url}/api/verify`).send( { url: this.base.options.url, owner: auth.uID } );
        } catch (e) {
            if (e.message && (e.message.match('Not Found') || e.message.match('[FAIL]') ) ) {
                return res.status(this.codes.badReq).send('[ERROR] VEXR failed Validation');
            }
            return res.status(this.codes.internalErr).send('[ERROR] Something unknown happened.');
        }
        const out = r.text;
        if (!out) {
            return res.status(this.codes.badReq).send('[ERROR] VEXR failed Validation');
        }
        const nOut = JSON.parse(out);
        if (nOut.url !== this.base.options.url) {
            return res.status(this.codes.badReq).send('[ERROR] VEXR failed Validation - Not set for this instance.');
        }
        if (!nOut['authentic-vexr'] ) {
            return res.status(this.codes.badReq).send('[ERROR] VEXR failed Validation - Not authentic VEXR.');
        }
        auth.cUrl = req.body.url;
        await auth.save();
        return res.status(this.codes.ok).send('[SUCCESS] Linked VEXR');
    }
}

export default VEXRAdd;
