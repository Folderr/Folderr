import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';
import { isArray } from 'util';

class Shorten extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorten';
        this.path = '/api/short';
        this.type = 'post';
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

        if (!req.body || !req.body.url) {
            return res.status(this.codes.noContent).send('[ERROR] Body URL needed!');
        }
        try {
            await this.base.superagent.get(req.body.url);
        } catch (err) {
            if (err === 'Not Found') {
                return res.status(this.codes.notFound).send('[ERROR] URL not found!');
            }
        }

        const links = await this.base.schemas.Shorten.find( { owner: req.headers.uid } );
        const ID = this.Utils.genID(links);
        const short = new this.base.schemas.Shorten( { ID, owner: req.headers.uid, link: req.body.url } );

        await short.save();
        return res.status(this.codes.created).send(`[SUCCESS] ${this.base.options.url}/short/${ID}`);
    }
}

export default Shorten;
