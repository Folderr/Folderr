import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';
import { Notification } from '../../Schemas/User';

class NotificationClass extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/notification';

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth by token/id
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // aGrab the notifications, and find the notification the user is looking for
        const { notifs } = auth;
        if (!notifs) {
            return res.status(this.codes.notFound).send('[ERROR] You have no notifications!');
        }
        const notify = notifs.find( (notification: Notification) => notification.ID === req.query.id);
        // If the notification is not found, tell the user
        if (!notify) {
            return res.status(this.codes.notFound).send('[ERROR] Notification not found!');
        }

        // Send found notification
        return res.status(this.codes.ok).send(notify);
    }
}

export default NotificationClass;
