import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Evolve from '../../Structures/Evolve';
import { Request, Response } from 'express';

class AdminNotification extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/admin_notification';

        this.type = 'get';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authToken(req, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Find notification. If not found, return a not found status code
        const notify = await this.base.schemas.AdminNotifs.findOne( { ID: req.query.id } );
        if (!notify) {
            return res.status(this.codes.notFound).send('[ERROR] Notification not found!');
        }

        // Oh look a notification!
        return res.status(this.codes.ok).send(notify);
    }
}

export default AdminNotification;
