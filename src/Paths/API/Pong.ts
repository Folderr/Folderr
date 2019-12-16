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
import pkg from '../../../package.json';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
momentDurationFormatSetup(moment);

class Pong extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Pong';
        this.path = '/api/';
        this.type = 'get';
    }

    /**
     * @desc PONG! Just a simple response, no auth needed
     */
    execute(req: any, res: any): Promise<Response | void> {
        const { version } = pkg;
        const nodeVersion = process.version;
        const uptime = process.uptime();
        const aUptime = moment.duration(uptime, 'seconds').format('MMMM [Months,] WW [Weeks,] DD [Days,] h [Hours,] m [Minutes,] s [Seconds]');
        const shards = this.base.useSharder && `${this.base.shardNum}/${this.base.maxShardNum}`;
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const onlineSince = new Date(new Date() - Math.round(uptime * 1000) );
        return res.status(this.codes.ok).send( {
            version, nodeVersion, onlineSince, uptime: aUptime, message: 'Pong!', shards,
        } );
    }
}

export default Pong;
