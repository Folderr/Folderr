import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Login extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Login';
        this.secureOnly = true;

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response> {
        if (!req.body || (req.body && (!req.body.username || !req.body.password || !req.body.token) ) ) {
            if (req.body && (req.body.username || req.body.password || req.body.token) ) {
                return res.status(this.codes.badReq).send('[ERROR] MISSING DETAIL(S)');
            }
            return res.status(this.codes.badReq).send('[ERROR] MISSING ALL DETAILS');
        }

        const auth = await this.Utils.authPasswordBody(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        if (!req.body.uid) {
            // eslint-disable-next-line require-atomic-updates
            req.body.uid = auth.uID;
        }
        if (!req.body.token) {
            const authToken = await this.Utils.authTokenBody(req);
            if (!authToken || typeof authToken === 'string') {
                return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
            }
        }
        // Set the cookie to expire in a weeks time
        const week = 604800000;
        const endTime = new Date(Date.now() + week);

        // Set cookies
        res.cookie('pass', req.body.password, { secure: true, expires: endTime } );
        res.cookie('name', req.body.username, { secure: true, expires: endTime } );
        if (req.body.token) {
            res.cookie('token', req.headers.token, { secure: true, expires: endTime } );
            res.cookie('uid', req.headers.uid, { secure: true, expires: endTime } );
        }

        return res.status(this.codes.noContent).send();
    }
}

export default Login;
