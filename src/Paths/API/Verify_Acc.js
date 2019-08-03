import Path from '../../Structures/Path';

class VerifyAccount extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Verify Account';
        this.load = true;
        this.path = '/api/verify';
        this.type = 'post';
    }

    async execute(req, res) {
        if (!req.headers.token && !req.body.token && !req.body.uid && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing auth token and user validation token!');
        } if (!req.headers.token || !req.body.token || !req.body.uid || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing auth token, auth id, user validation token, or the users id!');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(this.code.unauth).send('[ERROR] Authorization failed. Who are you?');
        }
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(this.codes.not_found).send('[ERROR] User not found!');
        }
        const { username, uID, password } = user;
        const nUser = new this.base.schemas.User( { username, uID, password } );
        await this.base.schemas.VerifyingUser.findOneAndRemove( { uID } );
        await nUser.save();
        let notifs = await this.base.schemas.AdminNotifs.find();
        let notify = notifs.find(notify => notify.notify.includes(user.uID) );
        await this.base.schemas.AdminNotifs.deleteOne(notify);
        console.log(`[INFO] - User ${nUser.uID}'s account has been verified by admin ${req.headers.uid}`);
        return res.status(this.codes.created).send('[SUCCESS] Verified user!');
    }
}

export default VerifyAccount;
