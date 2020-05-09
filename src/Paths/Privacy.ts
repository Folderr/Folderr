/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 VoidNulll
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
import Folderr from '../Structures/Folderr';
import { Response } from 'express';
import Base from '../Structures/Base';
import { join } from 'path';

class Privacy extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Privacy Policy';

        this.path = '/privacy';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    /**
     * @desc Displays the privacy policy to users
     */
    async execute(req: any, res: any): Promise<Response> {
        const dir = join(__dirname, '../Frontend/privacy.html');
        if (req.uauth) {
            return res.sendFile(join(__dirname, '../Frontend/privacy_loggedin.html') );
        }
        return res.sendFile(dir);
    }
}

export default Privacy;
