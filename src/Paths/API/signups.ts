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

import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {Response, Request} from 'express';
import wlogger from '../../Structures/winston-logger';

/**
 * @classdesc Allows users to signup
 */
class Signup extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Signup';

		this.path = '/api/signup';
		this.type = 'post';
	}

	async genUID(): Promise<string> {
		// Generate an ID, and do not allow a users id to be reused
		const uID = await this.Utils.genUID();
		const user = await this.core.db.findUser({uID});
		if (user) { // If the user was found, retry
			return this.genUID();
		}

		// Return user id
		return uID;
	}

	// NoEmail means there is no email server set up
	// userInfo: { username: string; userID: string; password: string; email: string }
	async noEmail(
		userInfo: {
			username: string;
			userID: string;
			password: string;
			email: string;
		},
		validationToken: {
			hash: string;
			token: string;
		},
		response: Response
	): Promise<{httpCode: number; msg: {code: number; message: string}}> {
		// Find admin notifications, and generate an ID
		const notifyID = await this.Utils.genNotifyID();
		// Make a new notification and save to database
		try {
			await Promise.all([
				this.core.db.makeVerify(userInfo, validationToken.hash),
				this.core.db.makeAdminNotify(
					notifyID,
					`Username: ${userInfo.username}\n` +
					`User ID: ${userInfo.userID}\n` +
					`Validation Token: ${validationToken.token}`,
					'New user signup!'
				)
			]);
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.handleError(error, response, undefined, {noResponse: true, noIncrease: false});
			}

			return {
				httpCode: this.codes.internalErr,
				msg: {
					code: this.Utils.FoldCodes.unkownError,
					message: 'An internal error occurred while signing up!'
				}
			};
		}

		// Notify the console, and the user that the admins have been notified.
		this.core.logger.info(
			`New user (${userInfo.username} - ${userInfo.userID})signed up to Folderr`
		);
		return {httpCode: this.codes.created, msg: {code: this.codes.created, message: 'OK'}};
	}

	async email(
		userInfo: {
			username: string;
			userID: string;
			password: string;
			email: string;
		},
		validationToken: {
			hash: string;
			token: string;
		},
		request: Request,
		response: Response
	): Promise<{
			httpCode: number;
			msg: {
				message: string;
				code: number;
			};
		}> {
		let url = await this.Utils.determineHomeURL(request);
		if (!/http(s)?:\/\//.test(url)) {
			url = `http://${url}`;
		}

		try {
			await this.core.emailer.verifyEmail(
				this.Utils.decrypt(userInfo.email),
				`${url}/verify/${userInfo.userID}/${validationToken.token}`,
				userInfo.username
			);
			await this.core.db.makeVerify(userInfo, validationToken.hash);
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.handleError(error, response, undefined, {noResponse: true, noIncrease: false});
			}

			return {
				httpCode: this.codes.internalErr,
				msg: {
					code: this.Utils.FoldCodes.unkownError,
					message: 'An internal error occurred while signing up!'
				}
			};
		}

		this.core.logger.info(
			`New user (${userInfo.username} - ${userInfo.userID}) signed up to Folderr`
		);
		return {
			httpCode: this.codes.created,
			msg: {
				code: this.Utils.FoldCodes.emailSent,
				message: 'OK'
			}
		};
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// If signups are closed, state that and do not allow them through
		if (!this.core.config.signups) {
			return response.status(this.codes.locked).json({
				code: this.codes.locked,
				message: 'Signup\'s are closed.'
			});
		}

		// Check all required body is there
		if (
			!request.body ||
			(
				request.body &&
				(
					!request.body.username ||
					!request.body.password ||
					!request.body.email
				)
			)
		) {
			return response.status(this.codes.badReq).json({
				code: this.codes.badReq,
				message: 'MISSING DETAIL(S)'
			});
		}

		// Fetch the username and password from the body
		const {username, password} = request.body;
		const isValid = await this.checkUserInput(request.body.email, username, password);
		if (typeof isValid !== 'boolean') {
			return response.status(isValid.httpCode).json(isValid.response);
		}

		// Hash the password and catch errors
		let pswd;
		try {
			pswd = await this.Utils.hashPass(password);
		} catch (error: unknown) {
			// Errors shouldnt happen here, so notify the console.. Also notify the user
			if (error instanceof Error) {
				wlogger.error(`[SIGNUP -  Create password] - ${error.message}`);
				return response.status(this.codes.internalErr).json({
					code: this.codes.internalErr,
					message: `${error.message}`
				});
			}

			return response.status(this.codes.internalErr).json({
				code: this.codes.internalErr,
				message: 'An unknown error occured!'
			});
		}

		// Generate the user ID and validation token.
		const uID = await this.genUID();
		const validationToken = await this.Utils.genValidationToken();
		const email = this.Utils.encrypt(request.body.email);
		// Add the user to the VerifyingUser database and save

		// Find admin notifications, and generate an ID
		const r = this.core.emailer.active && this.core.config.signups === 2 ?
			await this.email({
				username,
				userID: uID,
				password: pswd,
				email
			}, validationToken, request, response) :
			await this.noEmail({
				username,
				userID: uID,
				password: pswd,
				email
			}, validationToken, response);
		return response.status(r.httpCode).json(r.msg);
	}

	private async checkUserInput(email: string, username: string, password: string): Promise<{
		httpCode: number;
		response: {
			code: number;
			message: string;
		};
	} | boolean> {
		const maxUsername = 12;
		const minUsername = 3;
		const uMatch = this.core.regexs.username.exec(username);
		// If the username length does not match criteria
		if (username.length > maxUsername || username.length < minUsername) {
			return {
				httpCode: this.codes.badReq,
				response: {
					code: this.Utils.FoldCodes.usernameSizeLimit,
					message: 'Username must be between 3 and 12 characters!'
				}
			};
		}

		// If the username doess not match our username pattern
		if (!uMatch || (uMatch && username.length !== uMatch[0].length)) {
			return {
				httpCode: this.codes.badReq,
				response: {
					code: this.Utils.FoldCodes.illegalUsername,
					message: 'Username may only contain lowercase letters, numbers, and an underscore.'
				}
			};
		}

		if (!this.core.emailer.validateEmail(email)) {
			return {
				httpCode: this.codes.badReq,
				response: {
					code: this.Utils.FoldCodes.badEmail,
					message: 'Invalid email!'
				}
			};
		}

		const bans = await this.core.db.fetchFolderr({});
		if (bans.bans.includes(email)) {
			return {
				httpCode: this.codes.forbidden,
				response: {
					code: this.Utils.FoldCodes.bannedEmail,
					message: 'Email banned'
				}
			};
		}

		// See if the username is already taken. Fail if so.
		const user = await this.core.db.findUser({$or: [{username}, {email}]}) ??
			await this.core.db.findVerify({$or: [{username}, {email}]});
		if (user) {
			return {
				httpCode: this.codes.used,
				response: {
					code: this.Utils.FoldCodes.usernameOrEmailTaken,
					message: 'Username or email taken!'
				}
			};
		}

		// If the password is not over min length
		// If password does not match the regex completely
		const match = this.core.regexs.password.exec(password);
		if (!match || (match && match[0].length !== password.length)) {
			return {
				httpCode: this.codes.badReq,
				response: {
					code: this.Utils.FoldCodes.passwordSize,
					message: 'Password must be 8-32 long, contain 1 uppercase & lowercase letter, & 1 digit. Passwords allow for special characters.'
				}
			};
		}

		// No NUL charater
		if (password.includes('\0')) {
			return {
				httpCode: this.codes.forbidden,
				response: {
					code: this.Utils.FoldCodes.illegalPassword,
					message: 'NUL character forbidden in passwords!'
				}
			};
		}

		return true;
	}
}

export default Signup;
