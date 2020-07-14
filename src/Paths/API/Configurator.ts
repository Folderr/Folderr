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
import Configurator from '../../Structures/Utilities/ShareXConfigurator';

/**
 * @classdesc Generate a sharex configuration
 */
class ShareXConfigurator extends Path {
    private configurator: Configurator;

    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Configurator';
        this.path = '/api/sharex/config';
        this.type = 'post';
        this.configurator = new Configurator();
    }

    /**
     * @desc Generate a ShareX configuration
     */
    async execute(req: any, res: any): Promise<Response | void> {
        const auth = !req.cookies && !req.cookies.token ? await this.Utils.authorization.verifyAccount(req.headers.token) : await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        if (!req.body || !req.body.token) {
            return res.status(this.codes.unauth).json( { code: this.codes.badReq, message: 'Missing token in body!' } );
        }
        const compare = this.Utils.authorization.verifyAccount(req.body.token);
        if (!compare) {
            return res.status(this.codes.unauth).json( { code: this.codes.notAccepted, message: 'Invalid Token!' } );
        }
        const url = await this.Utils.determineHomeURL(req);

        const config = this.configurator.generateFiles(url, req.body.token);
        if (req.query && req.query.d === 'file') {
            res.type('text/plain; charset=binary');
            res.set('Content-Disposition', 'attachment; filename=Folderr-File-Config.sxcu');
            return res.status(this.codes.ok).send(config[0] );
        }
        if (req.query?.d && req.query.d === 'link') {
            res.type('text/plain; charset=binary');
            res.set('Content-Disposition', 'attachment; filename=Folderr-Link-Config.sxcu');
            return res.status(this.codes.ok).send(config[1] );
        }
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: config } );
    }
}

export default ShareXConfigurator;
