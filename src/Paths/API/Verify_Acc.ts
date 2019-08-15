import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import {Request, Response} from "express";
import {isArray} from "util";

class VerifyAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Verify Account';

        this.path = '/api/verify';
        this.type = 'post';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Handle if someone forgot something for authentication and finding the user
        if (!req.headers.token && !req.body.token && !req.body.uid && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing auth token and user validation token!');
        }
        if (!req.headers.token || !req.body.token || !req.body.uid || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing auth token, auth id, user validation token, or the users id!');
        }
        if (isArray(req.headers.token) || isArray(req.headers.uid) ) {
            return res.status(this.codes.bad_req).send('[ERROR] Neither header auth field may be an array!');
        }

        // Handle authorization
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // Look for the user
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.not_found).send('[ERROR] User not found!');
        }

        // Remove the user from verifying schema and add them to the actual user base
        const { username, uID, password } = user;
        const nUser = new this.base.schemas.User( { username, uID, password } );
        await this.base.schemas.VerifyingUser.findOneAndRemove( { uID } );
        await nUser.save();

        // Remove the admin notification stating that a user needs to be verified
        const notifs = await this.base.schemas.AdminNotifs.find();
        const notify = notifs.find(notif => notif.notify.includes(user.uID) );
        await this.base.schemas.AdminNotifs.deleteOne(notify);

        // Alert the console and the admin that the user was verified
        console.log(`[INFO] - User ${nUser.uID}'s account has been verified by admin ${req.headers.uid}`);
        return res.status(this.codes.created).send('[SUCCESS] Verified user!');
    }
}

export default VerifyAccount;
