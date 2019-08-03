import Path from '../../Structures/Path';

class DenyAccount extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Deny Account';
        this.load = true;
        this.path = '/api/verify';
        this.type = 'delete';
    }

    async execute(req, res) {
        if (!req.headers.token && !req.body.token && !req.body.uid && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing auth token and user validation token!');
        } if (!req.headers.token || !req.body.token || !req.body.uid || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing auth token, auth id, user validation token, or the users id!');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.not_found).send('[ERROR] User not found!');
        }
        await this.base.schemas.VerifyingUser.findOneAndRemove( { uID: user.uID } );
        const notifs = await this.base.schemas.AdminNotifs.find();
        const notify = notifs.find(notif => notif.notify.includes(user.uID) );
        await this.base.schemas.AdminNotifs.deleteOne(notify);
        console.log(`[INFO] - User ${user.uID}'s account was denied by admin ${req.headers.uid}`);
        return res.status(this.codes.ok).send('[SUCCESS] Denied user!');
    }
}

export default DenyAccount;
