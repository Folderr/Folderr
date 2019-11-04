import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Account extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] View Account';
        this.path = '/api/account';
        this.reqAuth = true;

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check headers, and check auth
        const auth = !req.cookies && !req.cookies.token && !req.cookies.sid ? await this.Utils.authPassword(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Image.find( { owner: auth.uID } );
        const shorts = await this.base.schemas.Shorten.find( { owner: auth.uID } );

        // Return a nice version of this users account.
        const acc = {
            username: auth.username, // eslint-disable-next-line @typescript-eslint/camelcase
            token_generated: !!auth.token,
            uID: auth.uID,
            admin: !!auth.admin,
            owner: !!auth.first,
            images: images.length,
            shorts: shorts.length,
        };
        return res.status(this.codes.ok).send(acc);
    }
}

export default Account;
