import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { Notification } from '../../Schemas/User';

class Notifs extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notifications';
        this.path = '/api/notifications';

        this.type = 'get';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth by token/id
        const auth = !req.cookies || !req.cookies.token || !req.cookies.token.startsWith('Bearer') ? await this.Utils.authToken(req) : await this.Utils.authBearerToken(req.cookies);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        // Grab the notifications from the user
        // eslint-disable-next-line prefer-destructuring
        let notifs: string[] | Notification[] | undefined = auth.notifs;
        // If the user wants to view admin notifications
        if (req.query && req.query.admin === 'true') {
            // If they arent a admin, they do not get to see these notifications
            if (!auth.admin) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }
            // Get the notifications, and reset the notifications array
            const anotifs = await this.base.schemas.AdminNotifs.find();
            notifs = anotifs.map( (notification: Notification) => `{ "ID":"${notification.ID}","title":"${notification.title}","notify":"${notification.notify.replace(/\n/g, ',')}" }`);
        }

        if (!notifs || notifs.length === 0) {
            return res.status(this.codes.ok).send( [] );
        }

        // Return whatever notifications there are
        return res.status(this.codes.ok).send(notifs);
    }
}

export default Notifs;
