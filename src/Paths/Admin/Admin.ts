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
import { join } from 'path';

class Admin extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Admin Hub';
        this.path = '/admin';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        return res.sendFile(join(__dirname, '../../Frontend/HTML/Admin.html') );
    }
}

export default Admin;
