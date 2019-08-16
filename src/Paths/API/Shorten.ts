import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';

class Shorten extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorten';
        this.path = '/api/short';
        this.type = 'post';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        if (!req.body || !req.body.url) {
            return res.status(this.codes.badReq).send('[ERROR] BODY URL MISSING!');
        }
        if (typeof req.body.url !== 'string') {
            return res.status(this.codes.badReq).send('[ERROR] URL MUST BE STRING');
        }
        try {
            await this.base.superagent.get(req.body.url);
        } catch (err) {
            if (err === 'Not Found') {
                return res.status(this.codes.notFound).send('[ERROR] URL not found!');
            }
        }

        const links = await this.base.schemas.Shorten.find( { owner: auth.uID } );
        const ID = this.Utils.genID(links);
        const short = new this.base.schemas.Shorten( { ID, owner: auth.uID, link: req.body.url } );

        await short.save();
        return res.status(this.codes.created).send(`[SUCCESS] ${this.base.options.url}/short/${ID}`);
    }
}

export default Shorten;
