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
import childProcess from 'child_process';
import util from 'util';
const exec = util.promisify(childProcess.exec);
import { promises } from 'fs';
import {isMaster} from "cluster";

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
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Manage';
        this.path = '/api/manage';

        this.type = 'post';
        this.reqAuth = true;
    }

    /**
     * Checks the versioning to see if the app has been updated, downgraded, or stayed the same
     * @param vObj
     *
     * @returns {string|boolean}
     */
    versionChecker(vObj: { af: string[]; old: string[] } ): 'u' | 'd' | false {
        const ar = [];
        if (Number(vObj.af[0] ) > Number(vObj.old[0] ) ) {
            return 'u';
        } if (Number(vObj.af[0] ) === Number(vObj.old[0] ) ) {
            ar.push(null);
        } else {
            ar.push(false);
        }
        if (Number(vObj.af[1] ) > Number(vObj.old[1] ) ) {
            ar.push(true);
        } else if (Number(vObj.af[1] ) === Number(vObj.old[1] ) ) {
            ar.push(null);
        } else {
            ar.push(false);
        }
        if (Number(vObj.af[2] ) > Number(vObj.old[2] ) ) {
            ar.push(true);
        } else if (Number(vObj.af[2] ) === Number(vObj.old[2] ) ) {
            ar.push(null);
        } else {
            ar.push(false);
        }
        if (!ar[0] ) {
            if (ar[1] === true) {
                return 'u';
            }
            if (ar[1] === null && ar[2] === true) {
                return 'u';
            }
            if (ar[1] === false) {
                return 'd';
            }
            if (ar[2] === false) {
                return 'd';
            }
        }
        return false;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authPassword(req, (user) => !!user.first) : await this.Utils.authCookies(req, res, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        if (!req.query || !req.query.type) {
            return res.status(this.codes.badReq).send('[ERROR] Missing manage type');
        }
        if (req.query.type === 's') {
            res.status(this.codes.ok).send('Shutting down in 1 minute');
            await this.base.Logger.log('SYSTEM - SHUTDOWN', 'System shutdown remotely by owner', { responsible: `${auth.username} (${auth.uID}` }, 'manage', 'System shutdown by system owner');
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
            res.status(this.codes.accepted).send('Updating.');
            try {
                await exec('yarn update');
            } catch (err) {
                await this._handleError(err, res, { noIncrease: true, noResponse: true } );
                return Promise.resolve();
            }
            const f = await promises.readFile('./package.json');
            const af = JSON.parse(f.toString() );
            let v;
            const vers = {
                af: af.version.split('.'),
                old: oPackage.version.split('.'),
            };
            const ver = this.versionChecker(vers);
            if (ver === 'u') {
                v = `Version upgraded from ${oPackage.version} to ${af.version}`;
            } else if (ver === false) {
                v = 'Version not changed';
            } else {
                v = `Version downgraded from ${oPackage.version} to ${af.version}`;
            }
            await this.base.Logger.log('SYSTEM - UPDATE', `System updated. ${v}`, { responsible: `${auth.username} (${auth.uID}` }, 'manage', 'System update');
            // eslint-disable-next-line require-atomic-updates
            oPackage = af;
            return Promise.resolve();
        } else if (req.query.type === 't') {
            res.status(this.codes.accepted).send('Transpiling.');
            try {
                await exec('tsc');
                await this.base.Logger.log('SYSTEM - TRANSPILE', 'System remotely transpiled', { responsible: `${auth.username} (${auth.uID}` }, 'manage', 'System Transpile');
            } catch (e) {
                await this._handleError(e, res, { noIncrease: true, noResponse: true } );
            }
            return Promise.resolve();
        }
        return res.status(this.codes.badReq).send('[ERROR] Not an option!');
    }
}

export default Manage;
