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

import Path from '../../src/Structures/Path';
import Evolve from '../Structures/Evolve';
import { Response } from 'express';
import Base from '../Structures/Base';
import { join } from 'path';

class ConfigGen extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Configuration Generator';

        this.path = '/config';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    /**
     * @desc ShareX Configuration Generator Frontend.
     */
    async execute(req: any, res: any): Promise<Response> {
        const dir = join(__dirname, '../Frontend/input_token.html');
        if (!req.uauth) {
            return res.redirect('/');
        }
        if (!req.query || !req.query.t) {
            return res.sendFile(dir);
        }
        return res.sendFile(join(__dirname, '../Frontend/genConfig.html') );
    }
}

export default ConfigGen;