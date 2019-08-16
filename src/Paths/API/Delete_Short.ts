import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';
import { isArray } from 'util';

class DeleteShort extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Short';
        this.path = 'api/short';

        this.type = 'delete';
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
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] ID needed in query!');
        }

        const short = await this.base.schemas.Shorten.findOneAndRemove( { ID: req.query.id } );
        if (!short) {
            return res.status(this.codes.notFound).send('[ERROR] Short not found!');
        }

        return res.status(this.codes.ok).send('[SUCCESS] Short removed!');
    }
}

export default DeleteShort;
