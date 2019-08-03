import Path from '../../Structures/Path';

class Account extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] View Account';
        this.path = '/api/account';

        this.type = 'get';
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

        const acc = {
            username: auth.username,
            token_generated: !!auth.token,
            uID: auth.uID,
            admin: !!auth.admin,
            owner: !!auth.first,
        };
        return res.status(this.codes.ok).send(acc);
    }
}

export default Account;
