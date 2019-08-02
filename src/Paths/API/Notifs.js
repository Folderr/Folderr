import Path from '../../Structures/Path';

class Notifs extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Notifications';
        this.path = '/api/notifs';

        this.type = 'get';
    }

    async execute(req, res) {
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        return res.status(this.codes.ok).send(auth.notifs);
    }
}

export default Notifs;
