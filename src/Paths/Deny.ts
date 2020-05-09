import Path from '../Structures/Path';
import Folderr from '../Structures/Folderr';
import Base from '../Structures/Base';
import { Response, Request } from 'express';

class Deny extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Deny Self';
        this.path = '/deny/:userID/:token';
        this.enabled = this.base.emailer.active && this.base.options.signups === 2;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        if (!req.params?.userID || !req.params?.token) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing requirements!' } );
        }
        const verify = await this.Utils.findVerifying(req.params.token, req.params.userID);
        if (!verify) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } );
        }
        await this.base.db.denySelf(verify.userID);

        this.base.Logger.log('SYSTEM INFO', 'User account verified by self', { user: `${verify.username} (${verify.userID}`, responsible: `${verify.username} (${verify.userID})` }, 'accountAccept', 'Account Verified');
        return res.status(this.codes.created).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default Deny;
