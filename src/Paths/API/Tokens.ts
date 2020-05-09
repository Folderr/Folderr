import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';

class Tokens extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] List Tokens';
        this.path = '/api/account/tokens';
    }

    async execute(req: Request, res: Response): Promise<Response | void> {
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authPassword(req);
        if (!auth) {
            return res.status(this.codes.unauth).json( { message: 'Authorization failed', code: this.codes.unauth } );
        }
        const tokens = await this.base.db.findTokens(auth.userID);
        return res.status(this.codes.ok).json( {
            code: this.codes.ok, message: tokens.filter(token => !token.web).map(token => {
                // eslint-disable-next-line @typescript-eslint/camelcase
                return { created: Math.round(token.created.getTime() / 1000), id: token.id, for_user: token.userID };
            } ),
        } );
    }
}

export default Tokens;
