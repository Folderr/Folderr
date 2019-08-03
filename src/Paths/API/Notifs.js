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
        let { notifs } = auth;
        if (req.query && req.query.admin === 'true') {
            if (!auth.admin) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }
            const anotifs = await this.base.schemas.AdminNotifs.find();
            notifs = [];
            for (const notify of anotifs) {
                notifs.push( {
                    ID: notify.id,
                    title: notify.title,
                    notify: notify.notify,
                } );
            }
        }

        return res.status(this.codes.ok).send(notifs);
    }
}

export default Notifs;
