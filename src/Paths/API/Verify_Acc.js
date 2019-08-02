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
            return res.status(204).send('[ERROR] Missing auth token and user validation token!');
        } else if (!req.headers.token || !req.body.token || !req.body.uid || !req.headers.uid) {
            return res.status(206).send('[ERROR] Missing auth token, auth id, user validation token, or the users id!');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(401).send('[ERROR] Authorization failed. Who are you?');
        }
        const user = await this.Utils.findVerifying(req.body.token, req.body.uid);
        if (!user) {
            return res.status(404).send('[ERROR] User not found!');
        }
        const { username, uID, password } = user;
        const nUser = new this.base.schemas.User({ username, uID, password });
        const u = await this.base.schemas.VerifyingUser.findOneAndRemove( { uID } );
        await nUser.save();
        console.log(`[INFO] - User ${nUser.uid}'s account has been verified by admin ${req.headers.uid}`);
        return res.status(200).send('[SUCCESS] Verified user!');
    }
}

export default VerifyAccount;
