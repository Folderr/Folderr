import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';
import { isArray } from 'util';

class DeleteAdmin extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Admin';
        this.path = '/api/del_admin';

        this.type = 'post';
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Make sure auth stuff is present
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.noContent).send('[ERROR] Missing authorization password and username!');
        } if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing either authorization password or username!');
        }
        if (isArray(req.headers.password) || isArray(req.headers.username) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        // Actually check auth, and make sure they are the owner
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth || (auth && !auth.first) ) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }

        // You need to supply the ID for the user via query
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
        if (!user.admin) {
            return res.status(this.codes.ok).send('[ERROR] User is not admin!');
        }
        user.admin = false;
        await user.save();
        return res.status(this.codes.ok).send(`[SUCCESS] Updated users admin status!`);
    }
}

export default DeleteAdmin;
