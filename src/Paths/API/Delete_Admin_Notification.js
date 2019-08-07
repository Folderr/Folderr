import Path from '../../Structures/Path';

class DelANotify extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Delete notification';
        this.path = '/api/admin_notification';

        this.type = 'delete';
    }

    async execute(req, res) {
        // If someone forgot some authorization stuff, or the ID to delete.
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing notification ID');
        }

        // Authorize the user as admin, or throw error.
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?'); // Fuck off
        }

        // Find the notification, and if it cant tell the user it  cannot find the notification with a code 404
        const notify = await this.base.schemas.AdminNotifs.findOne( { ID: req.query.id } );
        if (!notify) {
            return res.status(this.codes.not_found).send('[ERROR] Notification not found!');
        }
        // Signup notifications are invincible, at least to manual remove
        if (notify.title === 'forbidden') {
            return res.status(this.codes.forbidden).send('[ERROR] Signup notifications cannot be removed!');
        }

        // Remove the admin notification and tell the admin it was removed
        await this.base.schemas.AdminNotifs.findOneAndRemove( { ID: req.query.id } );
        return res.status(this.codes.ok).send('[SUCCESS] Notification removed!');
    }
}

export default DelANotify;
