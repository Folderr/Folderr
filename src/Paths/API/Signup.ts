/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
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
import { Response, Request } from 'express';
import wlogger from '../../Structures/WinstonLogger';

class Signup extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Signup';

        this.path = '/api/signup';
        this.type = 'post';
    }

    async genUID(): Promise<string> {
        // Generate an ID, and do not allow a users id to be reused
        const uID = await this.Utils.genUID();
        const user = await this.base.db.findUser( { uID } );
        if (user) { // If the user was found, retry
            return this.genUID();
        }
        // Return user id
        return uID;
    }

    // noEmail means there is no email server set up
    async noEmail(username: string, userID: string, password: string, validationToken: { hash: string; token: string }, email: string, res: Response): Promise<{ httpCode: number; msg: { code: number; message: string } }> {
        // Find admin notifications, and generate an ID
        const notifyID = await this.Utils.genNotifyID();
        // Make a new notification and save to database
        try {
            await Promise.all( [this.base.db.makeVerify(userID, username, password, validationToken.hash, email), this.base.db.makeAdminNotify(notifyID, `Username: ${username}\nUser ID: ${userID}\nValidation Token: ${validationToken.token}`, 'New user signup!')] );
        } catch (e) {
            this._handleError(e, res, { noResponse: true, noIncrease: false } );
            return { httpCode: this.codes.internalErr, msg: { code: this.Utils.FoldCodes.unknown_error, message: 'An internal error occurred while signing up!' } };
        }
        // Notify the console, and the user that the admins have been notified.
        this.base.Logger.log('SYSTEM - SIGNUP', `New user signed up to Folderr`, { user: `${username} (${userID})` }, 'signup', 'New user signup');
        return { httpCode: this.codes.created, msg: { code: this.codes.created, message: 'OK' } };
    }

    async email(username: string, userID: string, password: string, validationToken: { hash: string; token: string }, email: string, req: Request, res: Response): Promise<{ httpCode: number; msg: { message: string; code: number } }> {
        let url = await this.Utils.determineHomeURL(req);
        if (!url.match(/http(s)?:\/\//) ) {
            url = `http://${url}`;
        }
        try {
            await this.base.emailer.verifyEmail(this.Utils.decrypt(email), `${url}/verify/${userID}/${validationToken.token}`, username);
            await this.base.db.makeVerify(userID, username, password, validationToken.hash, email);
        } catch (e) {
            this._handleError(e, res, { noResponse: true, noIncrease: false } );
            return { httpCode: this.codes.internalErr, msg: { code: this.Utils.FoldCodes.unknown_error, message: 'An internal error occurred while signing up!' } };
        }
        this.base.Logger.log('SYSTEM - SIGNUP', `New user signed up to Folderr`, { user: `${username} (${userID})` }, 'signup', 'New user signup');
        return { httpCode: this.codes.created, msg: { code: this.Utils.FoldCodes.email_sent, message: 'OK' } };
    }

    async execute(req: any, res: any): Promise<Response> {
        // If signups are closed, state that and do not allow them through
        if (!this.base.options.signups) {
            return res.status(this.codes.locked).json( { code: this.codes.locked, message: 'Signup\'s are closed.' } );
        }

        // Check all required body is there
        if (!req.body || (req.body && (!req.body.username || !req.body.password || !req.body.email) ) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'MISSING DETAIL(S)' } );
        }

        // Fetch the username and password from the body
        const { username, password } = req.body;
        // Max and min username lengths
        const maxUsername = 12;
        const minUsername = 3;
        const uMatch = username.match(this.folderr.regexs.username);
        // If the username length does not match criteria
        if (username.length > maxUsername || username.length < minUsername) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.username_size_limit, message: 'Username must be between 3 and 12 characters!' } );
        } if (!uMatch || (uMatch && username.length !== uMatch[0].length) ) { // If the username doess not match our username pattern
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.illegal_username, message: 'Username may only contain lowercase letters, numbers, and an underscore.' } );
        }
        if (!this.base.emailer.validateEmail(req.body.email) ) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.bad_email, message: 'Invalid email!' } );
        }
        const bans = await this.base.db.fetchFolderr( {} );
        if (bans.bans.includes(req.query.email) ) {
            return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.banned_email, message: 'Email banned' } );
        }

        // See if the username is already taken. If its taken error the request with a code of "IM USED"
        const user = await this.base.db.findUser( { $or: [{ username: req.body.username }, { email: req.body.email }] } ) || await this.base.db.findVerify( { $or: [{ username: req.body.username }, { email: req.body.email }] } );
        if (user) {
            return res.status(this.codes.used).json( { code: this.Utils.FoldCodes.username_or_email_taken, message: 'Username or email taken!' } );
        }
        // If the password is not over min length
        // If password does not match the regex completely
        const match: RegExpMatchArray | null = password.match(this.folderr.regexs.password);
        if (!match || (match && match[0].length !== password.length) ) {
            return res.status(this.codes.badReq).json( { code: this.Utils.FoldCodes.password_size, message: 'Password must be 8-32 long, contain 1 uppercase & lowercase letter, & 1 digit. Passwords allow for special characters.' } );
        }
        // No NUL charater
        if (password.match('\0') ) {
            return res.status(this.codes.forbidden).json( { code: this.Utils.FoldCodes.illegal_password, messsage: 'NUL character forbidden in passwords!' } );
        }

        // Hash the password and catch errors
        let pswd;
        try {
            pswd = await this.Utils.hashPass(password);
        } catch (err) {
            // Errors shouldnt happen here, so notify the console.. Also notify the user
            wlogger.error(`[SIGNUP -  Create password] - ${err}`);
            return res.status(this.codes.internalErr).json( { code: this.codes.internalErr, message: `${err.message}` } );
        }

        // Generate the user ID and validation token.
        const uID = await this.genUID();
        const validationToken = await this.Utils.genValidationToken();
        const email = this.Utils.encrypt(req.body.email);
        // Add the user to the VerifyingUser database and save

        // Find admin notifications, and generate an ID
        const r = this.base.emailer.active && this.base.options.signups === 2 ? await this.email(username, uID, pswd, validationToken, email, req, res) : await this.noEmail(username, uID, pswd, validationToken, email, res);
        return res.status(r.httpCode).json(r.msg);
    }
}

export default Signup;
