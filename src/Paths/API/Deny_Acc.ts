import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';
import { isArray } from 'util';

class DenyAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Deny Account';

        this.path = '/api/verify';
        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers, body, and auth
        if (!req.headers.token && !req.body.token && !req.body.uid && !req.headers.uid) {
            return res.status(this.codes.noContent).send('[ERROR] Missing auth token and user validation token!');
        } if (!req.headers.token || !req.body.token || !req.body.uid || !req.headers.uid) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing auth token, auth id, user validation token, or the users id!');
        }
        if (isArray(req.headers.token) || isArray(req.headers.uid) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check auth by id/token
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
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
        console.log(`[INFO] - User ${user.uID}'s account was denied by admin ${req.headers.uid}`);
        return res.status(this.codes.ok).send('[SUCCESS] Denied user!');
    }
}

export default DenyAccount;
