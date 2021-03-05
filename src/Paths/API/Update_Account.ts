/**
 * @license
 *
 * core is an open source image host. https://github.com/core
 * Copyright (C) 2020 core
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
import Core from '../../Structures/Core';
import { compareSync } from 'bcrypt';
import { Response } from 'express';
import wlogger from '../../Structures/WinstonLogger';

/**
 * @classdesc Updating the authorized users account
 */
class UpdateAcc extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Update Account';
        this.path = '/api/account';

        this.type = 'patch';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Check pass/username auth
        const auth = await this.Utils.authPassword(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }
        // Check the query and new_key are correct
        if (!req.body || !req.body.username || !req.body.password || !req.body.email) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'BODY REQUIRES ONE OF PASSWORD, USERNAME, OR EMAIL!' } );
        }
        if (req.query?.cancelEmail) {
            await this.core.db.updateUser( { userID: auth.userID }, { pendingEmail: '', pendingEmailToken: '' } );
        }
        if (req.body.email && auth.pendingEmail && auth.pendingEmail.length > 0) {
            return res.status(this.codes.forbidden).json( { code: this.codes.forbidden, message: 'EMAIL UPDATE IN PROGRESS' } );
        }

        const update: { password?: string; username?: string; pendingEmail?: string; pendingEmailToken?: string } = {};
        if (req.body.password && !compareSync(req.body.password, auth.password) ) {
            try {
                const psw = await this.Utils.hashPass(req.body.password);
                update.password = psw;
            } catch (err) {
                if (err.message.startsWith('[PSW1]') ) {
                    return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.password_size, message: 'Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`' } );
                }
                if (err.message.startsWith('[PSW2]') ) {
                    return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.illegal_password, message: 'Password is too long, password must be under 32 characters of length' } );
                }
                if (err.message.startsWith('[PSW3]') ) {
                    return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.illegal_password, message: 'NUL character not allowed in password!' } );
                }
                wlogger.error(`[Update Account - Password] - ${err}`);
                return res.status(this.codes.badReq).json( { code: this.codes.internalErr, message: `${err}` } );
            }
        }

        if (req.body.username && req.body.username !== auth.username) {
            const maxUsername = 12;
            const minUsername = 3;
            // If username does not match length criteria error
            const match = req.body.username.match(this.core.regexs.username);
            if (req.body.username.length > maxUsername || req.body.username.length < minUsername) {
                return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.username_size_limit, message: 'Username must be between 3 and 12 characters!' } );
            } if (match && req.body.username.length !== match.length) { // If username does not matdch regex pattern error
                res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.illegal_username, message: 'Username may only contain lowercase letters, numbers, and an underscore.' } );
            }
            const user = await this.core.db.findUser( { username: req.body.username } ) || await this.core.db.findVerify( { username: req.body.username } );
            if (user) {
                return res.status(this.codes.used).json( { code: this.Utils.FoldCodes.username_or_email_taken, message: 'Username taken!' } );
            }

            update.username = req.body.username;
        }

        if (req.body.email && this.core.emailer.validateEmail(req.body.email) && req.body.email !== auth.email) {
            if (!this.core.emailer.active) {
                return res.status(this.codes.notImplemented).json( { code: this.Utils.FoldCodes.emailer_not_configured, message: 'Emailer not configured. Email is unable to be updated.' } );
            }
            const bans = await this.core.db.fetchFolderr( {} );
            if (bans.bans.includes(req.query.email) ) {
                return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.banned_email, message: 'Email banned' } );
            }
            const encrypted = this.Utils.encrypt(req.body.email);
            const user = await this.core.db.findUsers( { $or: [{ email: encrypted }, { pendingEmail: encrypted }] } ) || await this.core.db.findVerifies( { email: encrypted } );
            if (user) {
                return res.status(this.codes.used).json( { code: this.codes.used, message: 'Email used!' } );
            }
            const url = await this.Utils.determineHomeURL(req);
            const token = await this.Utils.genValidationToken();
            // Send confirmation email
            await this.core.emailer.changeEmail(req.body.email, `${url}/account/confirm/${token.token}`, auth.username);
            // Update
            update.pendingEmail = encrypted;
            update.pendingEmailToken = token.hash;
        } else if (req.body.email && !this.core.emailer.validateEmail(req.body.email) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Invalid email' } );
        }

        try {
            await this.core.db.updateUser( { uID: auth.userID }, update);
        } catch (err) {
            this.core.logger.error(`Database failed to update user - ${err}`);
            return res.status(this.codes.internalErr).json( { code: this.Utils.FoldCodes.db_unknown_error, message: 'Unknown Error encountered while updating your account' } );
        }

        // Return the output
        return res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } );
    }
}

export default UpdateAcc;
