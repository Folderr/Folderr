import Path from '../Structures/Path';
import Folderr from '../Structures/Folderr';
import Base from '../Structures/Base';
import { Response, Request } from 'express';

class Verify extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = 'Verify Self';
        this.path = '/verify/:userID/:token';
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
        const expiresAfter = 172800000; // 48H in MS
        const timeSinceCreation = Date.now() - Number(verify.created);
        if (timeSinceCreation >= expiresAfter) {
            await this.base.db.denySelf(verify.userID);
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.user_denied, message: 'Validation time expired.' } );
        }
        await this.base.db.verifySelf(verify.userID);

        this.base.Logger.log('SYSTEM INFO', 'User account verified by self', { user: `${verify.username} (${verify.userID}`, responsible: `${verify.username} (${verify.userID})` }, 'accountAccept', 'Account Verified');
        return res.status(this.codes.created).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default Verify;
