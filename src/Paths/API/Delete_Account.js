import Path from '../../Structures/Path';

class DelAccount extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Delete account';
        this.path = '/api/account';

        this.type = 'delete';
    }

    async deleteAccount(id, username) {
        try {
            await this.base.schemas.User.findOneAndDelete( { uID: id } );
            await this.base.schemas.Image.deleteMany( { owner: id } );
            console.log(`[INFO] - Account ${username} (${id}) deleted!`);
            return { code: this.codes.ok, mess: '[SUCCESS] Account deleted!' };
        } catch (err) {
            console.log(`[ERROR] - Account deletion error - ${err.message || err}`);
            return { code: this.codes.internal_err, mess: `[ERROR] Account deletion error - ${err.message || err}` };
        }
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

        if (req.query && req.query.uid) {
            if (!auth.admin) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }
            const mem = await this.base.schemas.User.findOne( { uID: req.query.uid } );
            if (!mem) {
                return res.status(!this.codes.not_found).send('[ERROR] User not found!');
            }

            // Protect the owner and admins from unauthorized account deletions
            if (mem.first) {
                return res.status(this.codes.forbidden).send('[ERROR] You can not delete that account as they are the owner!');
            } if (mem.admin && !auth.first) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }

            // Delete the account
            const out = await this.deleteAccount(req.query.uid, mem.username);
            return res.status(out.code).send(out.mess);
        }
        if (auth.first) {
            return res.status(this.codes.forbidden).send('[ERROR] You can not delete your account as you are the owner!');
        }

        const out = await this.deleteAccount(req.query.uid, req.headers.username);
        return res.status(out.code).send(out.mess);
    }
}

export default DelAccount;
