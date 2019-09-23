import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Admin extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Admin Hub';
        this.path = '/admin';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        if (req.cookies && req.cookies.token) {
            const auth = await this.Utils.authBearerToken(req.cookies);
            if (!auth || typeof auth === 'string') {
                res.clearCookie('token');
                return res.redirect('/');
            }
            if (!auth.admin) {
                return res.redirect('/');
            }
            return res.sendFile(join(__dirname, '../../Frontend/HTML/Admin.html') );
        }
        return res.redirect('/');
    }
}

export default Admin;
