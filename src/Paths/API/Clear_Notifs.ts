import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Evolve from '../../Structures/Evolve';
import { Response } from 'express';

class ClearNotifs extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Clear Notifications';
        this.path = '/api/notifications';
        this.reqAuth = true;

        this.type = 'delete';
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check auth
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // Clear the notifications and tell the user that happened
        auth.notifs = [];
        await this.base.schemas.User.findOneAndUpdate( { uID: auth.uID }, auth);
        return res.status(this.codes.ok).send('[SUCCESS] Notifications cleared!');
    }
}

export default ClearNotifs;
