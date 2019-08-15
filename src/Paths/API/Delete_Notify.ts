import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import {Request, Response} from "express";
import {isArray} from "util";

interface notification {
    title: string;
    notify: string;
    ID: string;
}

class DelNotify extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete notification';
        this.path = '/api/notification';

        this.type = 'delete';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers and query
        if (!req.headers.token && !req.headers.uid) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization token and user ID!');
        } if (!req.headers.token || !req.headers.uid) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization token or user ID!');
        }
        if (!req.query || (req.query && !req.query.id) ) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing notification ID');
        }
        if (isArray(req.headers.token) || isArray(req.headers.uid) ) {
            return res.status(this.codes.bad_req).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check auth
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // Grab the users notifications, and find the one they are looking for
        const { notifs } = auth;
        if (!notifs) {
            return res.status(this.codes.not_found).send('[ERROR] You have no notifications!');
        }
        const notify = notifs.find((notification: notification) => notification.ID === req.query.id);
        // If no notification, tell the user that notification does not exist
        if (!notify) {
            return res.status(this.codes.not_found).send('[ERROR] Notification not found!');
        }
        // Remove the notification, update the users account, and return success
        auth.notifs = notifs.filter((notification: notification) => notification.ID !== req.query.id);
        await this.base.schemas.User.findOneAndUpdate( { uID: auth.uID }, auth);
        return res.status(this.codes.ok).send('[SUCCESS] Notification removed!');
    }
}

export default DelNotify;
