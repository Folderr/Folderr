import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { User } from '../../Structures/Database/DBClass';

class Unban extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Unban';

        this.path = '/api/admin/ban';
        this.type = 'delete';
    }

    async execute(req: Request, res: Response) {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        if (!req.body?.email || this.base.emailer.validateEmail(req.body.email) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid requirements' } );
        }
        const unban = await this.base.db.removeFolderrBan(req.body.email);
        if (unban) {
            res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } ).end();
        } else {
            res.status(this.codes.notAccepted).json( { code: this.codes.notAccepted, message: 'UNBAN FAILED' } ).end();
        }
        // eslint-disable-next-line consistent-return
        return;
    }
}

export default Unban;
