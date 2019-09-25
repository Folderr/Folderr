import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Verification extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Admin Verification';
        this.path = '/admin/verify';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        return res.sendFile(join(__dirname, '../../Frontend/HTML/Admin_Verification.html') );
    }
}

export default Verification;
