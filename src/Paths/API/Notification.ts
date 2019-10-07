import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { Notification } from '../../Schemas/User';

class NotificationClass extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/notification';

        this.type = 'get';
        this.reqAuth = true;
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
            return res.status(this.codes.noContent).send();
        }
        const notify = notifs.find( (notification: Notification) => notification.ID === req.query.id);
        // If the notification is not found, tell the user
        if (!notify) {
            return res.status(this.codes.noContent).send();
        }

        // Send found notification
        return res.status(this.codes.ok).send(notify);
    }
}

export default NotificationClass;
