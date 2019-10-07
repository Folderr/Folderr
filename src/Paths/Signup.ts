import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Signup extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Sign up';
        this.path = '/signup';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response> {
        if (!req.secure) {
            // return res.status(this.codes.notAccepted).sendFile(join(__dirname, '../Frontend/HTML/SecureOnly.html') );
        }
        if (req.cookies && req.cookies.token) {
            const auth = await this.Utils.authBearerToken(req.cookies);
            if (!auth || typeof auth === 'string') {
                return res.redirect('./logout');
            }
            return res.redirect('./');
        }
        if (!this.base.options.signups) {
            return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/HTML/Not_Found.html') );
        }

        return res.sendFile(join(__dirname, '../Frontend/Signups.html') );
    }
}

export default Signup;
