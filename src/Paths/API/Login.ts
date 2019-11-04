import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Login extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Login';
        this.path = '/api/login';
        this.secureOnly = false;

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response|void> {
        if (!req.body || (req.body && (!req.body.username || !req.body.password) ) ) {
            if (req.body && (req.body.username || req.body.password) ) {
                return res.status(this.codes.badReq).send('[ERROR] MISSING DETAIL(S)');
            }
            return res.status(this.codes.badReq).send('[ERROR] MISSING ALL DETAILS');
        }

        const auth = await this.Utils.authPasswordBody(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        if (!req.query.isW) {
            this.evolve.Session.newSession(auth, req, res);
            return res.status(this.codes.ok).send('OK');
        }
        // Set the cookie to expire in a weeks time
        const week = 604800000;
        const endTime = new Date(Date.now() + week);
        const token = await this.Utils.genBearerToken(auth.uID);
        const tokenSchema = new this.base.schemas.BearerTokens( { uID: auth.uID, token: token.hash } );
        tokenSchema.save();

        // Set cookies
        await auth.save();
        res.cookie('token', token.token, { expires: endTime, secure: false, sameSite: 'Strict' } );
        return res.status(this.codes.ok).send('OK');
    }
}

export default Login;
