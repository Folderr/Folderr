import argon2 from "argon2";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import * as constants from "../../../Structures/constants/index.js";
import type { User } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account";
const method = "PATCH";

type UpdateAccBody = {
	email?: string;
	username?: string;
	password?: string;
	/** The account's current password. Needed to change the password, and to change the email without a login cookie */
	currentPassword?: string;
	privacy?: {
		dataCollection: boolean;
	};
};

type UpdateRequest = FastifyRequest<{
	Body: UpdateAccBody;
}>;

type Failure = {
	httpCode: number;
	message: {
		code: number;
		message: string;
	};
};

/**
 * @desc Hashes a new password, or explains why it can't be used.
 */
async function handlePassword(
	core: Core,
	password: string,
): Promise<Failure | string> {
	try {
		return await core.Utils.hashPass(password);
	} catch (error: unknown) {
		if (!(error instanceof Error)) {
			if (process.env.DEBUG) {
				core.logger.debug(error);
			}

			return {
				httpCode: core.codes.internalErr,
				message: {
					code: core.Utils.foldCodes.unkownError,
					message:
						"An unknown error occured with the handling of the password!",
				},
			};
		}

		if (error.message.startsWith("[PSW1]")) {
			return {
				httpCode: core.codes.badReq,
				message: {
					code: core.Utils.foldCodes.passwordSize,
					message:
						constants.ENUMS.RESPONSES.PASSWORD
							.PASSWORD_REQUIREMENTS,
				},
			};
		}

		if (error.message.startsWith("[PSW2]")) {
			return {
				httpCode: core.codes.badReq,
				message: {
					code: core.Utils.foldCodes.illegalPassword,
					message:
						constants.ENUMS.RESPONSES.PASSWORD
							.PASSWORD_LENGTH_EXCEED,
				},
			};
		}

		if (error.message.startsWith("[PSW3]")) {
			return {
				httpCode: core.codes.badReq,
				message: {
					code: core.Utils.foldCodes.illegalPassword,
					message: "NUL character not allowed in password!",
				},
			};
		}

		core.logger.error(`[Update Account - Password] - ${error.message}`);
		return {
			httpCode: core.codes.internalErr,
			message: {
				code: core.Utils.foldCodes.unkownError,
				message:
					"An unknown error occured with the handling of the password!",
			},
		};
	}
}

/**
 * @desc Starts an email change: checks the new address, then emails it a confirmation link.
 */
async function handleEmailUpdate(
	core: Core,
	request: UpdateRequest,
	authUser: User,
): Promise<
	| {
			accepted: true;
			pendingEmail: string;
			pendingEmailToken: string;
	  }
	| ({ accepted: false } & Failure)
	| undefined
> {
	const email = request.body.email;
	if (!email) {
		return undefined;
	}

	if (!core.emailer.validateEmail(email)) {
		return {
			httpCode: core.codes.badReq,
			message: {
				code: core.codes.badReq,
				message: "Invalid email",
			},
			accepted: false,
		};
	}

	if (authUser.email === email) {
		return {
			httpCode: core.codes.notAccepted,
			message: {
				code: core.codes.notAccepted,
				message: "Already using that email",
			},
			accepted: false,
		};
	}

	if (!core.emailer.active) {
		return {
			httpCode: core.codes.notImplemented,
			message: {
				code: core.Utils.foldCodes.emailerNotConfigured,
				message: "Emailer not configured. Unable to update email.",
			},
			accepted: false,
		};
	}

	if (await core.db.isBanned(email)) {
		return {
			httpCode: core.codes.forbidden,
			message: {
				code: core.Utils.foldCodes.bannedEmail,
				message: "Email banned",
			},
			accepted: false,
		};
	}

	// Taken by an account, an account's pending change, or a pending signup
	const [users, signups] = await Promise.all([
		core.db.findUsers({
			$or: [{ email }, { pendingEmail: email }],
		}),
		core.db.findVerifies({ email }),
	]);
	if (users.length > 0 || signups.length > 0) {
		return {
			httpCode: core.codes.used,
			message: {
				code: core.codes.used,
				message: "Email used!",
			},
			accepted: false,
		};
	}

	const url = await core.Utils.determineHomeURL(request);
	const token = await core.Utils.genWebValidationToken();
	await core.emailer.changeEmail(
		email,
		`${url}/confirm/${authUser.id}/${token.token}`,
		authUser.username,
	);
	return {
		accepted: true,
		pendingEmail: email,
		pendingEmailToken: token.hash,
	};
}

/**
 * @desc Checks a new username, returning it when it can be used.
 */
async function handleUsername(
	core: Core,
	preUsername: string,
	username: string,
): Promise<Failure | string> {
	if (username === preUsername) {
		return {
			httpCode: 226,
			message: {
				message: "You already have this username",
				code: core.Utils.foldCodes.usernameOrEmailTaken,
			},
		};
	}

	const maxUsername = 12;
	const minUsername = 3;
	if (username.length > maxUsername || username.length < minUsername) {
		return {
			httpCode: core.codes.badReq,
			message: {
				code: core.Utils.foldCodes.usernameSizeLimit,
				message: constants.ENUMS.RESPONSES.USERNAME.USERNAME_LENGTH,
			},
		};
	}

	if (!core.regexs.username.test(username)) {
		return {
			httpCode: core.codes.badReq,
			message: {
				code: core.Utils.foldCodes.illegalUsername,
				message:
					constants.ENUMS.RESPONSES.USERNAME
						.USERNAME_LETTER_REQUIREMENTS,
			},
		};
	}

	const user =
		(await core.db.findUser({ username })) ??
		(await core.db.findVerify({ username }));
	if (user) {
		return {
			httpCode: core.codes.used,
			message: {
				code: core.Utils.foldCodes.usernameOrEmailTaken,
				message: "Username taken!",
			},
		};
	}

	return username;
}

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Changes the signed-in user's password, username, email or privacy setting. Changing the password needs currentPassword. Changing the email needs the website login or currentPassword. A new email must be confirmed from the link sent to it",
			summary: "Update account",
			security: [{ apiKey: [] }],
			body: {
				type: "object",
				properties: {
					email: { type: "string" },
					password: { type: "string" },
					currentPassword: { type: "string" },
					username: { type: "string" },
					privacy: {
						type: "object",
						properties: {
							dataCollection: { type: "boolean" },
						},
						minProperties: 1,
					},
				},
				minProperties: 1,
				additionalProperties: false,
			},
			response: {
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"5xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"2xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request: UpdateRequest, reply: FastifyReply) {
			const authed = await core.Utils.checkAuth(request);
			if (authed.code !== 200) {
				return reply.status(authed.code).send({
					code: authed.code,
					message: "Authorization failed.",
				});
			}

			const auth = authed.user;
			const body = request.body;
			if (
				!body.username &&
				!body.password &&
				!body.email &&
				typeof body.privacy?.dataCollection !== "boolean"
			) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message:
						"BODY REQUIRES ONE OF password, username, privacy, OR email!",
				});
			}

			// Sensitive changes need more than an API token
			const passwordConfirmed =
				typeof body.currentPassword === "string" &&
				(await argon2.verify(auth.password, body.currentPassword));
			// checkAuth only uses the login cookie when there's no Authorization header
			const usedLoginCookie =
				!request.headers.authorization &&
				Boolean(request.cookies.token);

			if (body.password && !passwordConfirmed) {
				return reply.status(core.codes.unauth).send({
					code: core.codes.unauth,
					message:
						"Changing your password needs your current password",
				});
			}

			if (body.email && !passwordConfirmed && !usedLoginCookie) {
				return reply.status(core.codes.unauth).send({
					code: core.codes.unauth,
					message:
						"Changing your email needs the website login or your current password",
				});
			}

			const update: {
				password?: string;
				username?: string;
				pendingEmail?: string;
				pendingEmailToken?: string;
				tokenExpiresAt?: Date;
				privacy?: {
					dataCollection: boolean;
				};
			} = {};

			if (typeof body.privacy?.dataCollection === "boolean") {
				update.privacy = {
					dataCollection: body.privacy.dataCollection,
				};
			}

			// Only hash a password that's actually different
			if (
				body.password &&
				!(await argon2.verify(auth.password, body.password))
			) {
				const passwd = await handlePassword(core, body.password);
				if (typeof passwd !== "string") {
					return reply.status(passwd.httpCode).send(passwd.message);
				}

				update.password = passwd;
			}

			if (body.username) {
				const newUsername = await handleUsername(
					core,
					auth.username,
					body.username,
				);
				if (typeof newUsername !== "string") {
					return reply
						.status(newUsername.httpCode)
						.send(newUsername.message);
				}

				update.username = newUsername;
			}

			if (body.email) {
				const emailUpdated = await handleEmailUpdate(
					core,
					request,
					auth,
				);
				if (emailUpdated && !emailUpdated.accepted) {
					return reply
						.status(emailUpdated.httpCode)
						.send(emailUpdated.message);
				}

				if (emailUpdated?.accepted) {
					update.pendingEmail = emailUpdated.pendingEmail;
					update.pendingEmailToken = emailUpdated.pendingEmailToken;
					const expires = new Date();
					expires.setDate(expires.getDate() + 2);
					update.tokenExpiresAt = expires;
				}
			}

			try {
				await core.db.updateUser({ id: auth.id }, update);
			} catch (error: unknown) {
				core.app.sentry.withScope((scope) => {
					scope.addEventProcessor((event) => {
						core.app.sentry.addRequestDataToEvent(
							event,
							request.raw,
							{
								include: {
									ip: false,
									user: false,
								},
							},
						);
						return event;
					});
					if (auth.privacy?.dataCollection) {
						scope.setUser({
							id: auth.id,
							username: auth.username,
						});
					}

					core.app.sentry.captureException(error);
				});

				core.logger.error(
					`Database failed to update user - ${error instanceof Error ? error.message : String(error)}`,
				);
				return reply.status(core.codes.internalErr).send({
					code: core.Utils.foldCodes.dbUnkownError,
					message:
						"An unknown error encountered while updating your account",
				});
			}

			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized PATCH User Account at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/account",
	route,
} satisfies NeoRoute;
