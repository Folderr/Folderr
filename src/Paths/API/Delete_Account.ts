/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 VoidNulll
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import Path from '../../Structures/Path';
import Folderr from '../../Structures/Folderr';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { Upload, User } from '../../Structures/Database/DBClass';
import { promises } from 'fs';

interface DelReturns {
    code: number;
    mess: { code: number; message: string };
}

class DelAccount extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete account';
        this.path = '/api/account';
        this.reqAuth = true;

        this.type = 'delete';
    }

    /**
     * @desc Delete the account, separate function to make things be CLEAN
     * @param auth {UserI} The user deleting the account
     * @param id {string} The ID of the account that is being deleted
     * @async
     * @returns {DelReturns}
     */
    async deleteAccount(auth: User, id: string): Promise<DelReturns> {
        try {
            // Delete account by uID, and delete their pictures
            await this.base.db.purgeUser(id);
            return { code: this.codes.ok, mess: { code: this.codes.ok, message: 'Account deleted!' } };
        } catch (err) {
            // If an error occurs, log this (as there should not be an error), and tell the user that an error occured
            this.base.Logger.log('SYSTEM ERROR', `Account deletion failure - ${err.message || err}`, {}, 'error', 'Account deletion error.');
            return { code: this.codes.internalErr, mess: { code: this.codes.internalErr, message: `Account deletion error - ${err.message || err}` } };
        }
    }

    async execute(req: any, res: any): Promise<Response | void> {
        // Check headers, and check auth
        const auth = !req.cookies && !req.cookies.token && await this.Utils.authPassword(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        let out;
        // If you are an admin you can delete someones account by ID
        if (req.query && req.query.uid) {
            // If they are not an admin, they arent authorized
            if (!auth.admin) {
                return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
            }
            // Find the user, and if not return a not found
            const mem = await this.base.db.findUser( { uID: req.query.uid } );
            if (!mem) {
                return res.status(this.codes.notFound).json( { code: this.Utils.FoldCodes.db_not_found, message: 'User not found!' } );
            }

            // Protect the owner and admins from unauthorized account deletions
            if (mem.first) {
                return res.status(this.codes.forbidden).json( { code: this.codes.forbidden, message: 'You can not delete that account as they are the owner!' } );
            }
            if (mem.admin && !auth.first) {
                return res.status(this.codes.forbidden).json( { code: this.codes.forbidden, message: 'You cannot delete another admins account!' } );
            }
            // Delete the account
            out = await this.deleteAccount(auth, req.query.uid);
            this.base.Logger.log('SYSTEM INFO - ACCOUNT DELETE', 'Account deleted by administrator', { user: `${mem.username} (${mem.userID}`, responsible: `${auth.username} (${auth.userID})` }, 'accountDelete', 'Account deleted by Admin');
            res.status(out.code).json(out.mess).end();
            return this.base.addDeleter(req.query.uid);
        }
        // Owner account may never be deleted
        if (auth.first) {
            return res.status(this.codes.forbidden).json( { message: 'You can not delete your account as you are the owner!' } );
        }
        // Delete the users account
        out = await this.deleteAccount(auth, auth.userID); // Eslint, TS, I checked this at the top of the function. Please shut up
        this.base.Logger.log('SYSTEM INFO - ACCOUNT DELETE', 'Account deleted', { user: `${auth.username} (${auth.userID}` }, 'accountDelete', 'Account deleted from Folderr-X');

        res.status(out.code).json(out.mess).end();
        return this.base.addDeleter(auth.userID);
    }
}

export default DelAccount;
