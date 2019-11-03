import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Login extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Login';
        this.path = '/login';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response> {
        if (!req.secure) {
            return res.status(this.codes.notAccepted).sendFile(join(__dirname, '../Frontend/insecure_nochoice.html') );
        }
        if (req.cookies && req.cookies.token) {
            if (req.cookies) {
                const auth = await this.Utils.authBearerToken(req.cookies);
                if (!auth || typeof auth === 'string') {
                    return res.redirect('./logout');
                }
            }
            return res.redirect('/');
        }

        return res.sendFile(join(__dirname, '../Frontend/login.html') );
    }
}

export default Login;
