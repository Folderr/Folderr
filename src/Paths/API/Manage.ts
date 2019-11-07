import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import childProcess from 'child_process';
import util from 'util';
const exec = util.promisify(childProcess.exec);
import { promises } from 'fs';

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
            process.exit();
        } else if (req.query.type === 'u') {
            try {
                await exec('yarn update');
            } catch (err) {
                return res.status(this.codes.internalErr).send(`[ERROR] ${err}`);
            }
            const f = await promises.readFile('./package.json');
            const af = JSON.parse(f.toString() );
            let v;
            if (af.version > oPackage.version) {
                v = `Version upgraded from ${oPackage.version} to ${af.version}`;
            } else if (af.version === oPackage) {
                v = 'Version not changed';
            } else {
                v = `Version downgraded from ${oPackage.version} to ${af.version}`;
            }
            await this.base.Logger.log('SYSTEM - UPDATE', `System updated. ${v}`, { responsible: `${auth.username} (${auth.uID}` }, 'manage', 'System update');
            // eslint-disable-next-line require-atomic-updates
            oPackage = af;
            return res.status(this.codes.ok).send('[SUCCESS] Updated!');
        } else if (req.query.type === 't') {
            try {
                await exec('tsc');
                await this.base.Logger.log('SYSTEM - TRANSPILE', 'System remotely transpiled', { responsible: `${auth.username} (${auth.uID}` }, 'manage', 'System Transpile');
            } catch (e) {
                console.log(e);
                return res.status(this.codes.internalErr).send('[ERROR] TSC error. See console!');
            }
            return res.status(this.codes.ok).send('[SUCCESS] Compiled!');
        }
        return res.status(this.codes.badReq).send('[ERROR] Not an option!');
    }
}

export default Manage;
