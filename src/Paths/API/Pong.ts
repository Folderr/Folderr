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

import Path from '../../Structures/Path';
import Folderr from '../../Structures/Folderr';
import Base from '../../Structures/Base';
import { Response } from 'express';
import pkg from '../../../package.json';
import { platform as plat } from 'os';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
momentDurationFormatSetup(moment);

let platform: string = plat();
if (platform === 'win32') {
    platform = 'Windows';
} else if (platform === 'linux') {
    platform = 'Linux';
} else if (platform === 'darwim') {
    platform = 'MacOS';
} else {
    platform = 'Other';
}

class Pong extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Pong';
        this.path = '/api/';
        this.type = 'get';
    }

    /**
     * @desc PONG! Just a simple response, no auth needed
     */
    execute(req: any, res: any): Promise<Response | void> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return res.status(this.codes.ok).json( {
            message: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                version: pkg.version, node_version: process.version, online_since: new Date(Date.now() - (process.uptime() * 1000) ), uptime: process.uptime(), message: 'Pong!', shards: (this.base.useSharder && `${this.base.shardNum}/${this.base.maxShardNum}`) || 1, platform,
            },
            code: this.codes.ok,
        } );
    }
}

export default Pong;
