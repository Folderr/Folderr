import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';

class DeleteShort extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Short';
        this.path = 'api/short';

        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Check query
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] MISSING ID!');
        }

        const short = await this.base.schemas.Shorten.findOneAndRemove( { ID: req.query.id } );
        if (!short) {
            return res.status(this.codes.notFound).send('[ERROR] Short not found!');
        }

        return res.status(this.codes.ok).send('[SUCCESS] Short removed!');
    }
}

export default DeleteShort;
