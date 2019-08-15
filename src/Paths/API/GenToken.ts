import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { isArray } from 'util';

class GenToken extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Generate Token';
        this.path = '/api/token';

        this.type = 'post';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Make sure auth stuff is present
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.noContent).send('[ERROR] Missing authorization password and username!');
        } if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing either authorization password or username!');
        }
        if (isArray(req.headers.password) || isArray(req.headers.username) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check auth
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
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
