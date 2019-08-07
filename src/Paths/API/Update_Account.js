import Path from "../../Structures/Path";

class UpdateAcc extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Update Account';
        // this.load = false;
        this.path = '/api/account';

        this.type = 'patch';

        this.keys = {
            0: 'username',
            1: 'password'
        }
    }

    async updateUsername(user, name) {
        const maxUsername = 12;
        const minUsername = 3;
        if (name.length > maxUsername || name.length < minUsername) {
            return { code: this.codes.bad_req, mess: '[ERROR] Password must be between 3 and 12 characters!' };
        } if (name.length !== name.match(/[a-z0-9_]/g).length) {
            return { code: this.codes.bad_req, mess: '[ERROR] Password may only contain lowercase letters, numbers, and an underscore.' };
        }

        const users = await this.base.schemas.User.find();
        const usr = users.find(u => u.name === name);
        if (usr) {
            return { code: this.codes.used, mess: '[ERROR] Username taken!' };
        }

        try {
            user.username = name;
            await user.save();
        } catch (err) {
            return { code: thios.codes.internal_err, mess: `[ERROR] ${err.message || err}` };
        }

        return { code: this.codes.ok, mess: '[SUCCESS] Account Updated!' };
    }

    async updatePassword(user, pass) {
        let pswd;
        try {
            pswd = await this.Utils.hashPass(pass);
        } catch (err) {
            console.log(`[ERROR] [Update Account - Update password] - ${err}`);
            return { code: this.codes.internal_err, mess: `[ERROR] ${err.message}` };
        }

        try {
            user.password = pswd;
            await user.save();
        } catch(err) {
            console.log(`[ERROR] [Update Account - Update password] - ${err}`);
            return { code: this.codes.internal_err, mess: `[ERROR] ${err.message}` };
        }

        return { code: this.codes.ok, mess: '[SUCCESS] Account Updated!' };
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
        if (!req.query || !req.query.key || !req.body || !req.body.new_key) {
            return res.status(this.codes.no_content).send('[ERROR] Key you are updating is needed!');
        }
        const key = this.keys[req.query.key];
        if (!key) {
            return res.status(this.codes.bad_req).send('[ERROR] That key does not exist!');
        }

        let out = { code: this.codes.internal_err, mess: 'Something unknown happened' };
        try {
            if (key === 'username') {
                if (req.body.new_key === req.headers.username) {
                    return res.status(this.codes.bad_req).send('[ERROR] Your new username cannot be your old username!');
                }
                out = await this.updateUsername(auth, req.body.new_key);
            } else if (key === 'password') {
                if (req.body.new_key === req.headers.password) {
                    return res.status(this.codes.bad_req).send('[ERROR] Your new password cannot be your old password!');
                }
                out = await this.updatePassword(auth, req.body.new_key);
            }
        } catch (err) {
            return res.status(this.codes.internal_err).send(`[ERROR] ${err.message || err}`);
        }

        return res.status(out.code).send(out.mess);
    }
}

export default UpdateAcc;
