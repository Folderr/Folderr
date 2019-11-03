import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Logout extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'logout';
        this.path = '/logout';
        this.enabled = !this.base.options.apiOnly;
    }

    execute(req: any, res: any): Promise<Response | void> {
        const dir = join(__dirname, '../Frontend/loggedout.html');
        if (!req.cookies || !req.cookies.token) {
            return res.redirect('/');
        }
        res.clearCookie('token');
        return res.sendFile(dir);
    }
}

export default Logout;
