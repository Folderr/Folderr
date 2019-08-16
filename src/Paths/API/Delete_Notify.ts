import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';

class DelNotify extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete notification';
        this.path = '/api/notification';

        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Check query
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.badReq).send('[ERROR] Missing notification ID');
        }

        // Grab the users notifications, and find the one they are looking for
        const { notifs } = auth;
        if (!notifs) {
            return res.status(this.codes.notFound).send('[ERROR] You have no notifications!');
        }
        const notify = notifs.find(notification => notification.ID === req.query.id);
        // If no notification, tell the user that notification does not exist
        if (!notify) {
            return res.status(this.codes.notFound).send('[ERROR] Notification not found!');
        }
        // Remove the notification, update the users account, and return success
        auth.notifs = notifs.filter(notification => notification.ID !== req.query.id);
        await this.base.schemas.User.findOneAndUpdate( { uID: auth.uID }, auth);
        return res.status(this.codes.ok).send('[SUCCESS] Notification removed!');
    }
}

export default DelNotify;
