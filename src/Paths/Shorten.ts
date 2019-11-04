import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Shorten extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Shorten';
        this.path = '/shorten';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        /* if (req.cookies) {
            const auth = await this.Utils.authBearerToken(req.cookies);
            if (!auth || typeof auth === 'string') {
                return res.redirect('./logout');
            }
        }*/
        if (!req.uauth) {
            return res.redirect('./');
        }
        return res.sendFile(join(__dirname, '../Frontend/shorten.html') );
    }
}

export default Shorten;
