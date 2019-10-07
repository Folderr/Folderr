import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class VerifyAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Verify Account';

        this.path = '/api/verify';
        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Handle authorization
        const auth = !req.cookies || !req.cookies.token || !req.cookies.token.startsWith('Bearer') ? await this.Utils.authToken(req, (user) => !!user.admin) : await this.Utils.authBearerToken(req.cookies, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        if (!req.body.token && !req.body.uid) {
            return res.status(this.codes.badReq).send('[ERROR] BODY MISSING!');
        }
        if (!req.body.token || !req.body.uid) {
            return res.status(this.codes.badReq).send('[ERROR] BODY INCOMPLETE!');
        }

        // Look for the user
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.notFound).send('[ERROR] User not found!');
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
        console.log(`[INFO] - User ${nUser.uID}'s account has been verified by admin ${auth.username} (${auth.uID})`);
        return res.status(this.codes.created).send('[SUCCESS] Verified user!');
    }
}

export default VerifyAccount;
