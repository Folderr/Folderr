import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class AddAdmin extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Add Admin';
        this.path = '/api/admin';
        this.reqAuth = true;

        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authPassword(req, (user) => !!user.first) : await this.Utils.authCookies(req, res, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // You need to use the query to supply the users ID
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] Users ID is required!');
        }
        const match = req.query.id.match(/[0-9]+/);
        if (!match || match[0].length !== req.query.id.length) {
            return res.status(this.codes.badReq).send('[ERROR] ID is not a valid Evolve-X ID!');
        }
        const user = await this.base.schemas.User.findOne( { uID: req.query.id } );
        if (!user) {
            return res.status(this.codes.notFound).send('[ERROR] User not found!');
        }
        if (user.admin) {
            return res.status(this.codes.ok).send('[ERROR] User is already admin!');
        }
        user.admin = true;
        await user.save();
        console.log(`[SYSTEM INFO - ADMIN] - Admin added for user ${user.username}`);
        this.base.Logger.log('SYSTEM NOTICE - ADMIN', 'Administrator privileges granted to user.', { user: `${user.username} (${user.uID})`, responsible: `${auth.username} (${auth.uID})` }, 'adminGive', 'Account given Admin');
        return res.status(this.codes.ok).send(`[SUCCESS] Updated users admin status!`);
    }
}

export default AddAdmin;
