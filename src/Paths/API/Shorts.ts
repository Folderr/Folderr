import { Response } from 'express';
import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';

class Shorts extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorts';
        this.path = '/api/shorts';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        const shorts = await this.base.schemas.Shorten.find( { owner: auth.uID } );
        if (!shorts) {
            return res.status(this.codes.ok).send( [] );
        }
        const aShorts = shorts.map(short => `{ ID: ${short.ID}, link: ${short.link} }`);

        return res.status(this.codes.ok).send(aShorts);
    }
}

export default Shorts;
