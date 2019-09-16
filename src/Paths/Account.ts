import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Account extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Account';
        this.path = '/account';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        if (!req.secure) {
            return res.status(this.codes.notAccepted).sendFile(join(__dirname, '../Frontend/SecureOnly.html') );
        }
        if (req.cookies) {
            const auth = await this.Utils.authBearerToken(req.cookies);
            if (!auth || typeof auth === 'string') {
                return res.redirect('./logout');
            }
        }
        if (!req.cookies || !req.cookies.token) {
            return res.redirect('./');
        }

        const dir = join(__dirname, '../Frontend/HTML/Account.html');
        return res.sendFile(dir);
    }
}

export default Account;
