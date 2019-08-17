import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';

class GenToken extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Generate Token';
        this.path = '/api/token';

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authPassword(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // If the user has their token generated, make sure they know their current token will be gone
        if (auth.token) {
            if (!req.query || !req.query.flags || (req.query.flags && req.query.flags !== 'force') ) {
                return res.status(this.codes.forbidden).send('[ERROR] You have a token, so query.flags need to exist and be set to "force".\nThis will erase your current token');
            }
        }

        const token = await this.Utils.genToken(auth.uID);
        auth.token = token.hash;
        await auth.save();
        return res.status(this.codes.created).send(token.token);
    }
}

export default GenToken;
