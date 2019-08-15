import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Evolve from '../../Structures/Evolve';
import { Request, Response } from 'express';
import { isArray } from 'util';

class AdminNotification extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Notification';
        this.path = '/api/admin_notification';

        this.type = 'get';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers, and query (make sure it ais all there)
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.noContent).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing notification ID');
        }
        if (isArray(req.headers.token) || isArray(req.headers.uid) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check auth
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth || !auth.admin) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
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
