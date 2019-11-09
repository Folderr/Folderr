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
import Package from '../../../package.json';
import childProcess from 'child_process';
import util from 'util';
import { Response } from 'express';

const exec = util.promisify(childProcess.exec);

class Info extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Info';
        this.path = '/api/info';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req, (user) => !!user.admin) : await this.Utils.authCookies(req, res, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        let branch: any = await exec('git branch');
        branch = branch.stdout;
        branch = branch.split('\n');
        for (const b of branch) {
            if (b.startsWith('*') ) {
                branch = b.slice(2);
                break;
            }
        }
        let vers: any = await exec('git log -1 --oneline');
        vers = vers.stdout;

        const obj = {
            commit: vers,
            branch,
            version: Package.version,
        };
        return res.status(this.codes.ok).send(obj);
    }
}

export default Info;
