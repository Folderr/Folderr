import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';

interface DelReturns {
    code: number;
    mess: string;
}

class DelAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete account';
        this.path = '/api/account';

        this.type = 'delete';
    }

    async deleteAccount(id: string, username: string): Promise<DelReturns> {
        try {
            // Delete account by uID, and delete their pictures
            await this.base.schemas.User.findOneAndDelete( { uID: id } );
            await this.base.schemas.Image.deleteMany( { owner: id } );
            // Notify all that an account has been deleted, and tell the user as well
            console.log(`[INFO] - Account ${username} (${id}) deleted!`);
            return { code: this.codes.ok, mess: '[SUCCESS] Account deleted!' };
        } catch (err) {
            // If an error occurs, log this (as there should not be an error), and tell the user that an error occured
            console.log(`[ERROR] - Account deletion error - ${err.message || err}`);
            return { code: this.codes.internalErr, mess: `[ERROR] Account deletion error - ${err.message || err}` };
        }
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check headers, and check auth
        const auth = await this.Utils.authPassword(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        // If you are an admin you can delete someones account by ID
        if (req.query && req.query.uid) {
            // If they are not an admin, they arent authorized
            if (!auth.admin) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }
            // Find the user, and if not return a not found
            const mem = await this.base.schemas.User.findOne( { uID: req.query.uid } );
            if (!mem) {
                return res.status(this.codes.notFound).send('[ERROR] User not found!');
            }

            // Protect the owner and admins from unauthorized account deletions
            if (mem.first) {
                return res.status(this.codes.forbidden).send('[ERROR] You can not delete that account as they are the owner!');
            } if (mem.admin && !auth.first) {
                return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
            }

            // Delete the account
            const out = await this.deleteAccount(req.query.uid, mem.username);
            return res.status(out.code).send(out.mess);
        }
        // Owner account may never be deleted
        if (auth.first) {
            return res.status(this.codes.forbidden).send('[ERROR] You can not delete your account as you are the owner!');
        }

        // Delete the users account
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const out = await this.deleteAccount(req.query.uid, req.headers.username); // Eslint, TS, I checked this at the top of the function. Please shut up
        return res.status(out.code).send(out.mess);
    }
}

export default DelAccount;
