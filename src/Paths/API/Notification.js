import Path from '../../Structures/Path';

class Notification extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/notification';

        this.type = 'get';
    }

    async execute(req, res) {
        // Check headers for auth stuff and query for the notify id
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing notification ID');
        }
        // Check auth by token/id
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // aGrab the notifications, and find the notification the user is looking for
        const { notifs } = auth;
        const notify = notifs.find(notification => notification.ID === req.query.id);
        // If the notification is not found, tell the user
        if (!notify) {
            return res.status(this.codes.not_found).send('[ERROR] Notification not found!');
        }

        // Send found notification
        return res.status(this.codes.ok).send(notify);
    }
}

export default Notification;
