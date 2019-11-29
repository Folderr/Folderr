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
import Configurator from '../../Structures/ShareXConfigurator';
import { compareSync } from 'bcrypt';

class Configr extends Path {
    private configurator: Configurator;

    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Configurator';
        this.path = '/api/config';
        this.type = 'post';
        this.configurator = new Configurator();
    }

    /**
     * @desc Generate a ShareX configuration
     */
    async execute(req: any, res: any): Promise<Response | void> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authPassword(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        if (!req.body || !req.body.token) {
            return res.status(this.codes.unauth).send('[ERROR] Missing token in body!');
        }
        const compare = compareSync(req.body.token, auth.token);
        if (!compare) {
            return res.status(this.codes.unauth).send('[ERROR] Invalid Token!');
        }
        const url = auth.cUrl || this.base.options.url;

        const config = this.configurator.generateFiles(auth.uID, url, req.body.token);
        if (req.query && req.query.d === 'true') {
            res.type('text/plain; charset=binary');
            res.set('Content-Disposition', 'attachment; filename=EX-Config.sxcu');
        }
        return res.status(this.codes.ok).send(config);
    }
}

export default Configr;
