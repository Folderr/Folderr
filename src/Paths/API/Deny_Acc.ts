import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class DenyAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Deny Account';

        this.path = '/api/verify';
        this.type = 'delete';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth by id/token
        const auth = !req.cookies || !req.cookies.token || !req.cookies.token.startsWith('Bearer') ? await this.Utils.authToken(req, (user) => !!user.admin) : await this.Utils.authBearerToken(req.cookies, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Verify body
        if (!req.body.token && !req.body.uid) {
            return res.status(this.codes.badReq).send('[ERROR] BODY MISSING!');
        } if (!req.body.token || !req.body.uid) {
            return res.status(this.codes.badReq).send('[ERROR] BODY INCOMPLETE!');
        }
        // Search for the user, and if not found send in an error
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.notFound).send('[ERROR] User not found!');
        }
        // Deny the account via verifying
        await this.base.schemas.VerifyingUser.findOneAndRemove( { uID: user.uID } );
        // Find the admin notification, and remove it
        const notifs = await this.base.schemas.AdminNotifs.find();
        const notify = notifs.find(notif => notif.notify.includes(user.uID) );
        await this.base.schemas.AdminNotifs.deleteOne(notify);
        // Log that the account was denied by admin x, and tell the admin the account wa denied
        console.log(`[INFO] - User ${user.uID}'s account was denied by admin ${auth.username} (${auth.uID})`);
        return res.status(this.codes.ok).send('[SUCCESS] Denied user!');
    }
}

export default DenyAccount;
