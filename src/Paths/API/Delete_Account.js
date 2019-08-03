import Path from '../../Structures/Path';

class DelAccount extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Delete account';
        this.path = '/api/account';

        this.type = 'delete';
    }

    async execute(req, res) {
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization password and username!');
        } if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization password or username!');
        }
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }
        if (auth.first) {
            return res.status(this.codes.foribidden).send('[ERROR] You can not delete account as you are the owner!');
        }

        try {
            await this.base.schemas.User.findOneAndDelete( { uID: auth.uID } );
            await this.base.schemas.Image.deleteMany( { owner: auth.uID } );
            console.log(`[INFO] - Account ${req.headers.username} (${auth.uID}) deleted!`);
            return res.status(this.codes.ok).send('[SUCCESS] Account deleted!');
        } catch (err) {
            console.log(`[ERROR] - Account deletion error - ${err.message || err}`);
            return res.status(this.codes.internal_err).send(`[ERROR] Account deletion error - ${err.message || err}`);
        }
    }
}

export default DelAccount;
