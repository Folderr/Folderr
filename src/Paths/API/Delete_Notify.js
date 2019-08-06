import Path from '../../Structures/Path';

class DelNotify extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Delete notification';
        this.path = '/api/notification';

        this.type = 'delete';
    }

    async execute(req, res) {
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing notification ID');
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        const { notifs } = auth;
        const notify = notifs.find(notification => notification.ID === req.query.id);
        if (!notify) {
            return res.status(this.codes.not_found).send('[ERROR] Notification not found!');
        }
        auth.notifs = notifs.filter(notification => notification.ID !== req.query.id);
        await this.base.schemas.User.findOneAndUpdate( { uID: auth.uID }, auth);
        return res.status(this.codes.ok).send('[SUCCESS] Notification removed!');
    }
}

export default DelNotify;
