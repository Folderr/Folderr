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
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import {compareSync} from 'bcrypt';
import {Response} from 'express';
import wlogger from '../../Structures/winston-logger';
import {Request} from '../../Structures/Interfaces/express-extended';
import {User} from '../../Structures/Database/db-class';
import * as constants from '../../Structures/constants/index';

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

	async execute(request: Request, response: Response): Promise<Response> {
		// Check pass/username auth
		const base = await this.isValid(request);
		if (base.failed) {
			return response.status(base.httpCode).json(base.message);
		}

		const auth = (base as {failed: false; user: User}).user;

		const update: {
			password?: string;
			username?: string;
			pendingEmail?: string;
			pendingEmailToken?: string;
		} = {};
		if (
			request.body.password &&
			typeof request.body.password === 'string' &&
			!compareSync(request.body.password, auth.password)
		) {
			const passwd = await this.handlePassword(request.body.password);
			if (typeof passwd === 'string') {
				update.password = passwd;
			} else {
				return response.status(passwd.httpCode).json(passwd.message);
			}
		}

		const newUsername = await this.handleUsername(
			auth.username,
			request.body.username
		);

		if (newUsername && typeof newUsername === 'string') {
			update.username = newUsername;
		} else if (typeof newUsername === 'object') {
			return response.status(newUsername.httpCode).json(newUsername.message);
		}

		const emailUpdated = await this.handleEmailUpdate(
			request,
			auth.email,
			auth.username
		);
		if (emailUpdated && !emailUpdated.accepted) {
			return response.status(emailUpdated.httpCode).json(emailUpdated.message);
		}

		if (emailUpdated?.accepted) {
			update.pendingEmail = emailUpdated.pendingEmail;
			update.pendingEmailToken = emailUpdated.pendingEmailToken;
		}

		try {
			await this.core.db.updateUser({uID: auth.userID}, update);
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				if (process.env.DEBUG) {
					this.core.logger.debug(error);
				}

				return response.status(this.codes.internalErr).json({
					code: this.Utils.FoldCodes.unkownError,
					message: 'An unknown error has occured!'
				});
			}

			this.core.logger.error(
				`Database failed to update user - ${error.message}`
			);
			return response.status(this.codes.internalErr).json({
				code: this.Utils.FoldCodes.dbUnkownError,
				message: 'An unknown error encountered while updating your account'
			});
		}

		// Return the output
		return response
			.status(this.codes.ok)
			.json({code: this.codes.ok, message: 'OK'});
	}

	private async handlePassword(password: string): Promise<
		| {
				httpCode: number;
				message: {
					message: string;
					code: number;
				};
		  }
		| string
	> {
		try {
			const psw = await this.Utils.hashPass(password);
			return psw;
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				// If not a real error well, we don't care about it then
				if (process.env.DEBUG) {
					// We'll still log it if the project is in debug mode
					this.core.logger.debug(error);
				}

				return {
					httpCode: this.codes.internalErr,
					message: {
						code: this.Utils.FoldCodes.unkownError,
						message:
							'An unknown error occured with the handling of the password!'
					}
				};
			}

			if (error.message.startsWith('[PSW1]')) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.FoldCodes.passwordSize,
						message: constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS
					}
				};
			}

			if (error.message.startsWith('[PSW2]')) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.FoldCodes.illegalPassword,
						message: constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_LENGTH_EXCEED
					}
				};
			}

			if (error.message.startsWith('[PSW3]')) {
				return {
					httpCode: this.codes.forbidden,
					message: {
						code: this.Utils.FoldCodes.illegalPassword,
						message: 'NUL character not allowed in password!'
					}
				};
			}

			wlogger.error(`[Update Account - Password] - ${error.message}`);
			return {
				httpCode: this.codes.badReq,
				message: {
					code: this.codes.internalErr,
					message: `${error.message}`
				}
			};
		}
	}

	private async handleEmailUpdate(
		request: Request,
		preEmail: string,
		username: string
	): Promise<
		| {
				accepted: true;
				pendingEmail: string;
				pendingEmailToken: string;
		  }
		| {
				accepted: false;
				httpCode: number;
				message: {
					code: number;
					message: string;
				};
		  }
		| undefined
	> {
		if (!request.body.email) {
			return undefined;
		}

		if (
			request.body.email &&
			!this.core.emailer.validateEmail(request.body.email)
		) {
			return {
				httpCode: this.codes.badReq,
				message: {
					code: this.codes.badReq,
					message: 'Invalid email'
				},
				accepted: false
			};
		}

		if (
			request.body.email &&
			this.core.emailer.validateEmail(request.body.email) &&
			preEmail === request.body.email
		) {
			// Case email is present, valid, and same as email
			return {
				httpCode: this.codes.notAccepted,
				message: {
					code: this.codes.notAccepted,
					message: 'Already using that email'
				},
				accepted: false
			};
		}

		if (!this.core.emailer.active) {
			return {
				httpCode: this.codes.notImplemented,
				message: {
					code: this.Utils.FoldCodes.emailerNotConfigured,
					message: 'Emailer not configured. Unable to update email.'
				},
				accepted: false
			};
		}

		const bans = await this.core.db.fetchFolderr({});
		if (bans.bans.includes(request.body.email)) {
			return {
				httpCode: this.codes.forbidden,
				message: {
					code: this.Utils.FoldCodes.bannedEmail,
					message: 'Email banned'
				},
				accepted: false
			};
		}

		const encrypted = this.Utils.encrypt(request.body.email);
		const user =
			(await this.core.db.findUsers({
				$or: [
					{
						email: encrypted
					},
					{
						pendingEmail: encrypted
					}
				]
			})) || (await this.core.db.findVerifies({email: encrypted}));
		if (user) {
			return {
				httpCode: this.codes.used,
				message: {
					code: this.codes.used,
					message: 'Email used!'
				},
				accepted: false
			};
		}

		const url = await this.Utils.determineHomeURL(request);
		const token = await this.Utils.genValidationToken();
		// Send confirmation email
		await this.core.emailer.changeEmail(
			request.body.email,
			`${url}/account/confirm/${token.token}`,
			username
		);
		// Update
		return {
			accepted: true,
			pendingEmail: encrypted,
			pendingEmailToken: token.hash
		};
	}

	private async handleUsername(
		preUsername: string,
		username?: string
	): Promise<
		| {
				httpCode: number;
				message: {
					code: number;
					message: string;
				};
		  }
		| string
		| undefined
	> {
		if (username && username !== preUsername) {
			const maxUsername = 12;
			const minUsername = 3;
			// If username does not match length criteria error
			const badMatch = this.core.regexs.username.test(username);
			if (username.length > maxUsername || username.length < minUsername) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.FoldCodes.usernameSizeLimit,
						message: constants.ENUMS.RESPONSES.USERNAME.USERNAME_LENGTH
					}
				};
			}

			if (badMatch) {
				// If username does not matdch regex pattern error
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.FoldCodes.illegalUsername,
						message:
							constants.ENUMS.RESPONSES.USERNAME.USERNAME_LETTER_REQUIREMENTS
					}
				};
			}

			const user =
				(await this.core.db.findUser({username})) ??
				(await this.core.db.findVerify({username}));
			if (user) {
				return {
					httpCode: this.codes.used,
					message: {
						code: this.Utils.FoldCodes.usernameOrEmailTaken,
						message: 'Username taken!'
					}
				};
			}

			return username;
		}

		return undefined;
	}

	private async isValid(request: Request): Promise<
		| {
				httpCode: number;
				failed: boolean;
				message: {
					code: number;
					message: string;
				};
		  }
		| {
				failed: false;
				user: User;
		  }
	> {
		const auth = await this.Utils.authPassword(request);
		if (!auth || typeof auth === 'string') {
			return {
				httpCode: this.codes.unauth,
				message: {
					code: this.codes.unauth,
					message: 'Authorization failed.'
				},
				failed: false
			};
		}

		// Check the query and new_key are correct
		if (
			!request.body ||
			!request.body.username ||
			!request.body.password ||
			!request.body.email
		) {
			return {
				httpCode: this.codes.badReq,
				message: {
					code: this.codes.badReq,
					message: 'BODY REQUIRES ONE OF PASSWORD, USERNAME, OR EMAIL!'
				},
				failed: false
			};
		}

		if (
			request.body.email &&
			auth.pendingEmail &&
			auth.pendingEmail.length > 0
		) {
			return {
				httpCode: this.codes.forbidden,
				message: {
					code: this.codes.forbidden,
					message: 'EMAIL UPDATE IN PROGRESS'
				},
				failed: false
			};
		}

		return {failed: false, user: auth};
	}
}

export default UpdateAcc;