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
import Core from '../../Structures/Core';
import { Response, Request } from 'express';
import childProcess from 'child_process';
import util from 'util';
const exec = util.promisify(childProcess.exec);
import { promises } from 'fs';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const sleep = (ms: number): Promise<void> => {
    setTimeout( () => Promise.resolve(), ms);
};

let oPackage: any;

import('../../../package.json').then(f => {
    oPackage = f;
} );

/**
 * @classdesc Allows the owner to manage the instance
 */
class Manage extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Manage';
        this.path = '/api/manage';

        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: Request, res: Response): Promise<Response | void> {
        const auth = await this.Utils.authPassword(req, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        if (!req.query || !req.query.type) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing manage type' } );
        }
        if (req.query.type === 's') {
            res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
            await this.core.logger.info(`System shutdown remotely by owner (${auth.username} - ${auth.userID})`);
            const min = 60000;
            await sleep(min);
            process.exit();
        } else if (req.query.type === 'u') {
            res.status(this.codes.accepted).json( { code: this.codes.ok, message: 'OK' } );
            try {
                const ecmd = 'npm';

                await exec(`${ecmd} update`);
            } catch (err) {
                await this._handleError(err, res, { noIncrease: true, noResponse: true } );
                return Promise.resolve();
            }
            const f = await promises.readFile('./package.json');
            const af = JSON.parse(f.toString() );
            let v;
            const vers = {
                af: Number(af.version.split('.').join(' ') ),
                old: Number(oPackage.version.split('.').join(' ') ),
            };
            if (vers.af > vers.old) {
                v = `Version upgraded from ${oPackage.version} to ${af.version}`;
            } else if (vers.af === vers.old) {
                v = 'Version not changed';
            } else {
                v = `Version downgraded from ${oPackage.version} to ${af.version}`;
            }
            await this.core.logger.info(`System updated. ${v}`);
            // eslint-disable-next-line require-atomic-updates
            oPackage = af;
            return Promise.resolve();
        } else if (req.query.type === 't') {
            res.status(this.codes.accepted).json( { code: this.codes.ok, message: 'OK' } );
            try {
                await exec('tsc');
                await this.core.logger.info(`System remotely transpiled by ${auth.username} (${auth.userID})`);
            } catch (e) {
                await this._handleError(e, res, { noIncrease: true, noResponse: true } );
            }
            return Promise.resolve();
        }
        return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Not an option!' } );
    }
}

export default Manage;
