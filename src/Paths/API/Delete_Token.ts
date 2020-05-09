import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';

class DeleteToken extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Token';
        this.path = '/api/account/token/:id';
        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response | void> {
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authPassword(req);
        if (!auth) {
            return res.status(this.codes.unauth).json( { message: 'Authorization failed', code: this.codes.unauth } );
        }
        if (!req.params?.id || /^\d+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid token ID!' } );
        }
        const del = await this.base.db.purgeToken(req.params.id, auth.userID, { web: req.query?.web || false } );
        if (!del) {
            return res.status(this.codes.notAccepted).json( { code: this.codes.badReq, message: 'Token not deleted/found!' } );
        }
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default DeleteToken;
