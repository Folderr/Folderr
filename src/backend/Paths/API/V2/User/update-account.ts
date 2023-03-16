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

import process from 'process';
import argon2 from 'argon2';
import type {FastifyRequest, FastifyReply} from 'fastify';
import type {Core} from '../../../../internals';
import {Path} from '../../../../internals';
import type {User} from '../../../../Structures/Database/db-class';
import * as constants from '../../../../Structures/constants/index';

type UpdateAccBody =
	| {
			email: string;
			username?: string;
			password?: string;
			privacy?: {
				dataCollection: boolean;
			};
	  }
	| {
			username: string;
			email?: string;
			password?: string;
			privacy?: {
				dataCollection: boolean;
			};
	  }
	| {
			password: string;
			email?: string;
			username?: string;
			privacy?: {
				dataCollection: boolean;
			};
	  }
	| {
			password?: string;
			email?: string;
			privacy?: {
				dataCollection: boolean;
			};
			username?: string;
	  };

/**
 * @classdesc Updating the authorized users account
 */
class UpdateAcc extends Path {
	constructor(core: Core) {
		super(core);
		this.label = 'API/User Update Account';
		this.path = '/account';

		this.type = 'patch';
		this.reqAuth = true;
		this.options = {
			schema: {
				body: {
					type: 'object',
					properties: {
						email: {type: 'string'},
						password: {type: 'string'},
						username: {type: 'string'},
						privacy: {
							type: 'object',
							properties: {
								dataCollection: {type: 'boolean'},
							},
							minProperties: 1,
						},
					},
					minProperties: 1,
					additionalProperties: false,
				},
				response: {
					/* eslint-disable @typescript-eslint/naming-convention */
					'4xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'},
						},
					},
					'5xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'},
						},
					},
					'2xx': {
						type: 'object',
						properties: {
							message: {type: 'string'},
							code: {type: 'number'},
						},
					},
				},
			},
		};
	}
	/* eslint-enable @typescript-eslint/naming-convention */

	async execute(
		request: FastifyRequest<{
			Body: UpdateAccBody;
		}>,
		response: FastifyReply,
	) {
		// Check pass/username auth
		const base = await this.isValid(request);
		if (base.failed) {
			return response.status(base.httpCode).send(base.message);
		}

		const auth = (base as {failed: false; user: User}).user;

		const update: {
			password?: string;
			username?: string;
			pendingEmail?: string;
			pendingEmailToken?: string;
			privacy?: {
				dataCollection: boolean;
			};
		} = {};
		// Handle data collection change
		if (typeof request.body.privacy?.dataCollection === 'boolean') {
			update.privacy = {
				dataCollection: request.body.privacy.dataCollection,
			};
		}

		// Password
		if (
			request.body.password &&
			typeof request.body.password === 'string' &&
			!(await argon2.verify(auth.password, request.body.password))
		) {
			const passwd = await this.handlePassword(request.body.password);
			if (typeof passwd === 'string') {
				update.password = passwd;
			} else {
				return response.status(passwd.httpCode).send(passwd.message);
			}
		}

		// Username
		if (request.body.username) {
			const newUsername = await this.handleUsername(
				auth.username,
				request.body.username,
			);

			if (newUsername && typeof newUsername === 'string') {
				update.username = newUsername;
			} else if (typeof newUsername === 'object') {
				return response.status(newUsername.httpCode).send(newUsername.message);
			}
		}

		// Email
		if (request.body.email) {
			const emailUpdated = await this.handleEmailUpdate(
				request,
				auth.email,
				auth.username,
			);
			if (emailUpdated && !emailUpdated.accepted) {
				return response
					.status(emailUpdated.httpCode)
					.send(emailUpdated.message);
			}

			if (emailUpdated?.accepted) {
				update.pendingEmail = emailUpdated.pendingEmail;
				update.pendingEmailToken = emailUpdated.pendingEmailToken;
			}
		}

		try {
			await this.core.db.updateUser({id: auth.id}, update);
			await this.core.db.findUser({id: auth.id});
		} catch (error: unknown) {
			this.core.app.sentry.withScope((scope) => {
				scope.addEventProcessor((event) => {
					this.core.app.sentry.addRequestDataToEvent(event, request.raw, {
						include: {
							ip: false,
							user: false,
						},
					});
					return event;
				});
				if (auth.privacy?.dataCollection) {
					scope.setUser({
						id: auth.id,
						username: auth.username,
					});
				}

				this.core.app.sentry.captureException(error);
			});

			if (!(error instanceof Error)) {
				if (process.env.DEBUG) {
					this.core.logger.debug(error);
				}

				return response.status(this.codes.internalErr).send({
					code: this.Utils.foldCodes.unkownError,
					message: 'An unknown error has occured!',
				});
			}

			this.core.logger.error(
				`Database failed to update user - ${error.message}`,
			);
			return response.status(this.codes.internalErr).send({
				code: this.Utils.foldCodes.dbUnkownError,
				message: 'An unknown error encountered while updating your account',
			});
		}

		// Return the output
		return response
			.status(this.codes.ok)
			.send({code: this.codes.ok, message: 'OK'});
	}

	private async handlePassword(password: string): Promise<
		| {
				httpCode: 400 | 500;
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
						code: this.Utils.foldCodes.unkownError,
						message:
							'An unknown error occured with the handling of the password!',
					},
				};
			}

			if (error.message.startsWith('[PSW1]')) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.foldCodes.passwordSize,
						message: constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS,
					},
				};
			}

			if (error.message.startsWith('[PSW2]')) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.foldCodes.illegalPassword,
						message: constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_LENGTH_EXCEED,
					},
				};
			}

			if (error.message.startsWith('[PSW3]')) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.foldCodes.illegalPassword,
						message: 'NUL character not allowed in password!',
					},
				};
			}

			this.core.logger.error(`[Update Account - Password] - ${error.message}`);
			return {
				httpCode: this.codes.badReq,
				message: {
					code: this.codes.internalErr,
					message: `${error.message}`,
				},
			};
		}
	}

	private async handleEmailUpdate(
		request: FastifyRequest<{
			Body: UpdateAccBody;
		}>,
		preEmail: string,
		username: string,
	): Promise<
		| {
				accepted: true;
				pendingEmail: string;
				pendingEmailToken: string;
		  }
		| {
				accepted: false;
				httpCode: 226 | 400 | 403 | 406 | 501;
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
					message: 'Invalid email',
				},
				accepted: false,
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
					message: 'Already using that email',
				},
				accepted: false,
			};
		}

		if (!this.core.emailer.active) {
			return {
				httpCode: this.codes.notImplemented,
				message: {
					code: this.Utils.foldCodes.emailerNotConfigured,
					message: 'Emailer not configured. Unable to update email.',
				},
				accepted: false,
			};
		}

		const bans = await this.core.db.fetchFolderr({});
		if (bans.bans.includes(request.body.email)) {
			return {
				httpCode: this.codes.forbidden,
				message: {
					code: this.Utils.foldCodes.bannedEmail,
					message: 'Email banned',
				},
				accepted: false,
			};
		}

		const user =
			(await this.core.db.findUsers({
				$or: [
					{
						email: request.body.email,
					},
					{
						pendingEmail: request.body.email,
					},
				],
			})) || (await this.core.db.findVerifies({email: request.body.email}));
		if (user) {
			return {
				httpCode: this.codes.used,
				message: {
					code: this.codes.used,
					message: 'Email used!',
				},
				accepted: false,
			};
		}

		const url = await this.Utils.determineHomeURL(request);
		const token = await this.Utils.genValidationToken();
		// Send confirmation email
		await this.core.emailer.changeEmail(
			request.body.email,
			`${url}/account/confirm/${token.token}`,
			username,
		);
		// Update
		return {
			accepted: true,
			pendingEmail: request.body.email,
			pendingEmailToken: token.hash,
		};
	}

	private async handleUsername(
		preUsername: string,
		username?: string,
	): Promise<
		| {
				httpCode: 226 | 400;
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
			if (username.length > maxUsername || username.length < minUsername) {
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.foldCodes.usernameSizeLimit,
						message: constants.ENUMS.RESPONSES.USERNAME.USERNAME_LENGTH,
					},
				};
			}

			const goodMatch = this.core.regexs.username.test(username);

			if (!goodMatch) {
				// If username does not matdch regex pattern error
				return {
					httpCode: this.codes.badReq,
					message: {
						code: this.Utils.foldCodes.illegalUsername,
						message:
							constants.ENUMS.RESPONSES.USERNAME.USERNAME_LETTER_REQUIREMENTS,
					},
				};
			}

			const user =
				(await this.core.db.findUser({username})) ??
				(await this.core.db.findVerify({username}));
			if (user) {
				return {
					httpCode: this.codes.used,
					message: {
						code: this.Utils.foldCodes.usernameOrEmailTaken,
						message: 'Username taken!',
					},
				};
			}

			return username;
		}

		return {
			httpCode: 226,
			message: {
				message: 'You already have this username',
				code: this.Utils.foldCodes.usernameOrEmailTaken,
			},
		};
	}

	private async isValid(
		request: FastifyRequest<{
			Body: UpdateAccBody;
		}>,
	): Promise<
		| {
				httpCode: 400 | 401 | 403;
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
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === 'string') {
			return {
				httpCode: this.codes.unauth,
				message: {
					code: this.codes.unauth,
					message: 'Authorization failed.',
				},
				failed: true,
			};
		}

		// Check the query and new_key are correct
		if (
			!request.body ||
			(!request.body.username &&
				!request.body.password &&
				!request.body.email &&
				typeof request.body.privacy?.dataCollection !== 'boolean')
		) {
			return {
				httpCode: this.codes.badReq,
				message: {
					code: this.codes.badReq,
					message:
						'BODY REQUIRES ONE OF password, username, privacy, OR email!',
				},
				failed: true,
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
					message: 'EMAIL UPDATE IN PROGRESS',
				},
				failed: true,
			};
		}

		return {failed: false, user: auth};
	}
}

export default UpdateAcc;
