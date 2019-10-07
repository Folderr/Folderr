import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { join } from 'path';
import { Response } from 'express';

class Manage extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Manage';
        this.path = '/owner/manage';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        if (req.cookies && req.cookies.token) {
            const auth = await this.Utils.authBearerToken(req.cookies, (user) => !!user.first);
            if (!auth || typeof auth === 'string') {
                res.clearCookie('token');
                return res.redirect('/');
            }
            if (!auth.admin) {
                return res.redirect('/');
            }
            return res.sendFile(join(__dirname, '../../Frontend/manage.html') );
        }
        return res.redirect('/');
    }
}

export default Manage;
