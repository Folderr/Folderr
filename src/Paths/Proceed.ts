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

class Proceed extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Proceed Security Check';

        this.path = '/proceed';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    /**
     * @desc Allows the user to make insecure requests, for 30 minutes ... if they came from an evolve-x page.
     */
    async execute(req: any, res: any): Promise<Response | void> {
        const r =  req.header('Referer');
        if (!r) {
            return res.redirect('/');
        }
        const mins = 1800000;
        const endTime = new Date(Date.now() + mins);
        res.cookie('i', 't', { expires: endTime, secure: false, sameSite: 'Strict', httpOnly: true } );
        return res.redirect(`${r}`);
    }
}

export default Proceed;
