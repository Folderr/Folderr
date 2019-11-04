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
        if (!req.secure && !this.Utils.verifyInsecureCookies(req) ) {
            return res.status(this.codes.notAccepted).sendFile(join(__dirname, '../Frontend/insecure.html') );
        }
        if (req.uauth) {
            return res.redirect('./');
        }
        if (!this.base.options.signups) {
            return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/closed.html') );
        }

        return res.sendFile(join(__dirname, '../Frontend/signups.html') );
    }
}

export default Signup;
