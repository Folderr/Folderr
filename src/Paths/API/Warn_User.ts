import { Response } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { User } from '../../Structures/Database/DBClass';

class WarnUser extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Warn User';
        this.path = '/api/admin/warn/:id';
        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } ).end();
        }
        if (!req.params?.id || !req.body?.reason || !/^[0-9]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Requirements missing or invalid!' } ).end();
        }
        const user = await this.base.db.findUser( { userID: req.params.id } );
        if (!user) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } ).end();
        }
        const email = this.Utils.decrypt(user.email);
        const id = await this.Utils.genNotifyID();
        const updated = await this.base.db.updateUser( { userID: req.params.id }, { $addToSet: { notifs: { ID: id, title: 'Warn', notify: `You were warned for: ${req.body.reason}` } } } );
        if (!updated) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.unknown_error, message: 'Warn failed' } ).end();
        }
        if (this.base.emailer.active) {
            const url = await this.Utils.determineHomeURL(req);
            await this.base.emailer.warnEmail(email, req.body.reason, user.username, url);
        }
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default WarnUser;
