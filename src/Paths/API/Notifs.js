import Path from '../../Structures/Path';

class Notifs extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Notifications';
        this.path = '/api/notifications';

        this.type = 'get';
    }

    async execute(req, res) {
        // Check headers for auth stuff
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        // Check auth by token/id
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }
        // Grab the notifications from the user
        let { notifs } = auth;
        // If the user wants to view admin notifications
        if (req.query && req.query.admin === 'true') {
            // If they arent a admin, they do not get to see these notifications
            if (!auth.admin) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }
            // Get the notifications, and reset the notifications array
            const anotifs = await this.base.schemas.AdminNotifs.find();
            notifs = [];
            // Loop through these notifications and push each one to the notifs array
            for (const notify of anotifs) {
                notifs.push( {
                    ID: notify.ID,
                    title: notify.title,
                    notify: notify.notify,
                } );
            }
        }

        // Return whatever notifications there are
        return res.status(this.codes.ok).send(notifs);
    }
}

export default Notifs;
