import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Evolve from '../../Structures/Evolve';
import { Response } from 'express';
import { UserI } from '../../Schemas/User';

class AdminNotification extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/admin_notification';
        this.reqAuth = true;

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = !req.cookies || !req.cookies.token || !req.cookies.token.startsWith('Bearer') ? await this.Utils.authToken(req, (user: UserI) => !!user.admin) : await this.Utils.authBearerToken(req.cookies, (user: UserI) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Verify query
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] Notification ID required!');
        }

        // Find notification. If not found, return a not found status code
        const notify = await this.base.schemas.AdminNotifs.findOne( { ID: req.query.id } );
        if (!notify) {
            return res.status(this.codes.noContent).send();
        }

        // Oh look a notification!
        return res.status(this.codes.ok).send(notify);
    }
}

export default AdminNotification;
