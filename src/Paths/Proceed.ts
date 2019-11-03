import Path from '../../src/Structures/Path';
import Evolve from '../Structures/Evolve';
import { Response } from 'express';
import Base from '../Structures/Base';
import { join } from 'path';

class Proceed extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Proceed Security Check';

        this.path = '/proceed';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const r =  req.header('Referer');
        if (!r) {
            return res.redirect('/');
        }
        const mins = 1800000;
        const endTime = new Date(Date.now() + mins);
        res.cookie('i', 't', { expires: endTime, secure: false, sameSite: 'Strict' } );
        res.redirect(`${r}`);
    }
}

export default Proceed;
