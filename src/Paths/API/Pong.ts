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

interface Gitinfo {
    branch?: string;
    commit?: string;
}

/**
 * @classdesc Shows overall information
 */
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
        const out: { message: { version: string; node_version: string; online_since: number; message: string; shards?: number; git?: Gitinfo }; code: number } = {
            message: {
                version: pkg.version, // eslint-disable-next-line @typescript-eslint/camelcase
                node_version: process.version, // eslint-disable-next-line @typescript-eslint/camelcase
                online_since: new Date(Date.now() - (process.uptime() * 1000) ).getTime(),
                message: 'Pong!',
                shards: (this.base.useSharder && this.base.shardNum) || undefined,
            },
            code: this.codes.ok,
        };
        if (this.folderr.gitinfo) {
            out.message.git = {
                commit: this.folderr.gitinfo.run_commit,
                branch: this.folderr.gitinfo.branch,
            };
        }
        return res.status(this.codes.ok).json(out);
    }
}

export default Pong;
