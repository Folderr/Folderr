import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';

class VerifyAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Verify Account';

        this.path = '/api/verify';
        this.type = 'post';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Handle authorization
        const auth = await this.Utils.authToken(req, (user) => !!user.admin);
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
        console.log(`[INFO] - User ${nUser.uID}'s account has been verified by admin ${req.headers.uid}`);
        return res.status(this.codes.created).send('[SUCCESS] Verified user!');
    }
}

export default VerifyAccount;
