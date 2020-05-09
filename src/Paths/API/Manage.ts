/**
 * @license
 *
 * Folderr is an open source file host. https://github.com/Folderr
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
import childProcess from 'child_process';
import util from 'util';
const exec = util.promisify(childProcess.exec);
import { platform } from 'os';
import { promises } from 'fs';
import { isMaster } from 'cluster';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const sleep = (ms: number): Promise<void> => {
    setTimeout( () => Promise.resolve(), ms);
};

let oPackage: any;

import('../../../package.json').then(f => {
    oPackage = f;
} );

class Manage extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Manage';
        this.path = '/api/manage';

        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = await this.Utils.authPassword(req, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        if (!req.query || !req.query.type) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing manage type' } );
        }
        if (req.query.type === 's') {
            res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
            await this.base.Logger.log('SYSTEM - SHUTDOWN', 'System shutdown remotely by owner', { responsible: `${auth.username} (${auth.userID})` }, 'manage', 'System shutdown by system owner');
            const min = 60000;
            await sleep(min);
            if (this.base.useSharder) {
                if (isMaster) {
                    await this.base.killAll();
                    process.exit();
                } else {
                    this.base.sendToMaster( { messageType: 'kill', value: 0 } );
                    // eslint-disable-next-line consistent-return
                    return;
                }
            }
            process.exit();
        } else if (req.query.type === 'u') {
            res.status(this.codes.accepted).json( { code: this.codes.ok, message: 'OK' } );
            try {
                const cmd = platform() !== 'win32' ? 'which' : 'where';
                let ecmd = 'yarn';
                try {
                    const hasYarn = await exec(`${cmd} yarn`);
                    if (hasYarn.stderr) {
                        ecmd = 'npm';
                    } else if (hasYarn.stdout && hasYarn.stdout.match('/yarn') ) {
                        ecmd = 'yarn';
                    }
                } catch (e) {
                    ecmd = 'npm';
                }

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
            await this.base.Logger.log('SYSTEM - UPDATE', `System updated. ${v}`, { responsible: `${auth.username} (${auth.userID})` }, 'manage', 'System update');
            // eslint-disable-next-line require-atomic-updates
            oPackage = af;
            return Promise.resolve();
        } else if (req.query.type === 't') {
            res.status(this.codes.accepted).json( { code: this.codes.ok, message: 'OK' } );
            try {
                await exec('tsc');
                await this.base.Logger.log('SYSTEM - TRANSPILE', 'System remotely transpiled', { responsible: `${auth.username} (${auth.userID})` }, 'manage', 'System Transpile');
            } catch (e) {
                await this._handleError(e, res, { noIncrease: true, noResponse: true } );
            }
            return Promise.resolve();
        }
        return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Not an option!' } );
    }
}

export default Manage;
