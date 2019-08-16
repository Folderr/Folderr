import { Request, Response } from 'express';
import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { isArray } from 'util';

class Shorts extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorts';
        this.path = '/api/shorts';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.noContent).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (isArray(req.headers.token) || isArray(req.headers.uid) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        const shorts = await this.base.schemas.Shorten.find( { owner: auth.uID } );
        const aShorts = shorts.map(short => `{ ID: ${short.ID}, link: ${short.link} }`);

        return res.status(this.codes.ok).send(aShorts);
    }
}

export default Shorts;
