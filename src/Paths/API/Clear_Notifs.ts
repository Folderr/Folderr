import Path from '../../Structures/Path';
import Base from "../../Structures/Base";
import Evolve from "../../Structures/Evolve";
import {Request, Response} from "express";
import {isArray} from "util";

class ClearNotifs extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Clear Notifications';
        this.path = '/api/notifications';

        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers, and check auth
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (isArray(req.headers.token) || isArray(req.headers.uid) ) {
            return res.status(this.codes.bad_req).send('[ERROR] Neither header auth field may be an array!');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // Clear the notifications and tell the user that happened
        auth.notifs = [];
        await this.base.schemas.User.findOneAndUpdate( { uID: auth.uID }, auth);
        return res.status(this.codes.ok).send('[SUCCESS] Notifications cleared!');
    }
}

export default ClearNotifs;
