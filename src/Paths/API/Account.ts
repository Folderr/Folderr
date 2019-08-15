import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import {Request, Response} from "express";
import {isArray} from "util";

class Account extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] View Account';
        this.path = '/api/account';

        this.type = 'get';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers, and check auth
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization password and username!');
        } if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization password or username!');
        }
        if (isArray(req.headers.password) || isArray(req.headers.username) ) {
            return res.status(this.codes.bad_req).send('[ERROR] Neither header auth field may be an array!');
        }
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // Return a nice version of this users account.
        const acc = {
            username: auth.username,
            token_generated: !!auth.token,
            uID: auth.uID,
            admin: !!auth.admin,
            owner: !!auth.first,
        };
        return res.status(this.codes.ok).send(acc);
    }
}

export default Account;
