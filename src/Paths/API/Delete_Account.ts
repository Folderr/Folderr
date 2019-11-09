/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { UserI } from '../../Schemas/User';
import { ImageI } from '../../Schemas/Image';
import { promises } from 'fs';

interface DelReturns {
    code: number;
    mess: string;
}

class DelAccount extends Path {
    constructor(evolve: Evolve, base: Base) {
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
    async deleteAccount(auth: UserI, id: string): Promise<DelReturns> {
        try {
            // Delete account by uID, and delete their pictures
            await this.base.schemas.User.findOneAndDelete( { uID: id } );
            await this.base.schemas.Image.deleteMany( { owner: id } );
            await this.base.schemas.Shorten.deleteMany( { owner: id } );
            await this.base.schemas.BearerTokens.deleteMany( { uID: id } );
            return { code: this.codes.ok, mess: '[SUCCESS] Account deleted!' };
        } catch (err) {
            // If an error occurs, log this (as there should not be an error), and tell the user that an error occured
            this.base.Logger.log('SYSTEM ERROR', `Account deletion failure - ${err.message || err}`, {}, 'error', 'Account deletion error.');
            return { code: this.codes.internalErr, mess: `[ERROR] Account deletion error - ${err.message || err}` };
        }
    }

    async execute(req: any, res: any): Promise<Response | void> {
        // Check headers, and check auth
        const auth = !this.Utils.checkCookies(req) ? await this.Utils.authPassword(req) : await this.Utils.authCookies(req, res);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        let images,
            out;
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
            images = await this.base.schemas.Image.find( { owner: req.query.uid } );
            // Delete the account
            out = await this.deleteAccount(auth, req.query.uid);
            this.base.Logger.log('SYSTEM INFO - ACCOUNT DELETE', 'Account deleted by administrator', { user: `${mem.username} (${mem.uID}`, responsible: `${auth.username} (${auth.uID})` }, 'accountDelete', 'Account deleted by Admin');
            res.status(out.code).send(out.mess);
            return this.deleteImages(images);
        }
        // Owner account may never be deleted
        if (auth.first) {
            return res.status(this.codes.forbidden).send('[ERROR] You can not delete your account as you are the owner!');
        }
        images = await this.base.schemas.Image.find( { owner: auth.uID } );
        // Delete the users account
        out = await this.deleteAccount(auth, auth.uID); // Eslint, TS, I checked this at the top of the function. Please shut up
        this.base.Logger.log('SYSTEM INFO - ACCOUNT DELETE', 'Account deleted', { user: `${auth.username} (${auth.uID}` }, 'accountDelete', 'Account deleted from Evolve-X');

        res.status(out.code).send(out.mess);
        return this.deleteImages(images);
    }

    deleteImages(images: ImageI[] ): void {
        images.forEach(async image => {
            await promises.unlink(image.path);
            console.log(`[SYSTEM INFO - DELETE ACCOUNT] Removed image ${image.path} (${image.ID} from user ${image.owner}!`);
        } );
    }
}

export default DelAccount;
