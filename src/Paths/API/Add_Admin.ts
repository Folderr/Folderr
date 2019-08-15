import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';
import { isArray } from 'util';

class AddAdmin extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Add Admin';
        this.path = '/api/add_admin';

        this.type = 'post';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Make sure all of the auth stuff is there
        // As this is rather sensitive, we will require username and password authentication
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.noContent).send('[ERROR] Missing authorization password and username!');
        } if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing either authorization password or username!');
        }
        // Make sure the auth is not an arrray. Arrays are bad for auth
        if (isArray(req.headers.password) || isArray(req.headers.username) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check auth, and make sure the user is owner. Only owner can update someones admin status
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth || (auth && !auth.first) ) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // You need to use the query to supply the users ID
        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] Users ID is required!');
        }
        const match = req.query.id.match(/[0-9]{18, 22}/);
        if (!match || match.length !== req.query.id.length) {
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
        return res.status(this.codes.ok).send(`[SUCCESS] Updated users admin status!`);
    }
}

export default AddAdmin;
