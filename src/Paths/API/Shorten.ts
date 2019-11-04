import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Shorten extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Shorten';
        this.path = '/api/short';
        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authToken(req) : await this.Utils.authCookies(req, res);
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
            if (err.code === 'ENOTFOUND') {
                return res.status(this.codes.notFound).send('[ERROR] URL not found!');
            }
        }

        const links = await this.base.schemas.Shorten.find( { owner: auth.uID } );
        const ID = this.Utils.genID(links);
        const short = new this.base.schemas.Shorten( { ID, owner: auth.uID, link: req.body.url } );

        console.log(`[INFO - SHORTS] Short ${this.base.options.url}/short/${ID} added!`);

        await short.save();
        return res.status(this.codes.created).send(`${this.base.options.url}/short/${ID}`);
    }
}

export default Shorten;
