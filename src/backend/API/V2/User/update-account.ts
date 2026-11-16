import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import * as constants from "../../../Structures/constants/index.js";
import {
	normalizeInput,
	type User,
} from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import { hashPass, verifyPassword } from "../../../security/passwords.js";
import { genValidationToken } from "../../../security/verification.js";

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

type RouteTypes = {
	Body: UpdateAccBody;
};

type UpdateRequest = FastifyRequest<RouteTypes>;

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
		return await hashPass(password);
	} catch (error: unknown) {
		if (!(error instanceof Error)) {
			core.logger.debug(error);

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

	// Taken by an account, a pending signup, or someone elses account
	// If you ask your email to be changed to the same pending email you just get a new token
	if (
		normalizeInput(email) !== authUser.pendingEmail &&
		(await core.db.isEmailTaken(email))
	) {
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
	const token = await genValidationToken();
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
	username: string,
): Promise<Failure | string> {
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

	if (await core.db.isUsernameTaken(username)) {
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
	fastify.route<RouteTypes>({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Changes the signed-in user's password, username, email or privacy setting. Changing the password needs currentPassword. Changing the email needs the website login or currentPassword. A new email must be confirmed from the link sent to it",
			summary: "Update account",
			security: [{ username: [], password: [] }, { loginCookie: [] }],
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
					examples: [
						{ code: 401, message: "Authorization failed." },
						{
							code: 401,
							message:
								"Changing your password needs your current password",
						},
						{
							code: 1014,
							message:
								constants.ENUMS.RESPONSES.PASSWORD
									.PASSWORD_REQUIREMENTS,
						},
						{
							code: 1018,
							message:
								"Username must be between 3 and 12 characters!",
						},
						{ code: 1060, message: "Email banned" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"5xx": {
					examples: [
						{
							code: 1053,
							message:
								"An unknown error encountered while updating your account",
						},
						{
							code: 1059,
							message:
								"Emailer not configured. Unable to update email.",
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"2xx": {
					examples: [
						{ code: 200, message: "OK" },
						{
							code: 1016,
							message: "You already have this username",
						},
						{ code: 226, message: "Email used!" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		preHandler: [
			// User needs either their username & password or a session
			fastify.policy.requireSessionOrPassword,
			// If you provide the new password I hope you provide the old one too
			fastify.policy.requirePasswordConfirmation<UpdateAccBody>((body) =>
				Boolean(body.password),
			), // Does the new password match the old one?
			async (
				request: FastifyRequest<RouteTypes>,
				reply: FastifyReply,
			) => {
				const user = request.server.requestUser(request);
				if (
					request.body.password &&
					(await verifyPassword(user.password, request.body.password))
				) {
					return reply.status(request.server.codes.badReq).send({
						code: request.server.codes.badReq,
						message:
							"Your new password cannot be the same as your old one",
					});
				}
			},
			// Other checks
			async (
				request: FastifyRequest<RouteTypes>,
				reply: FastifyReply,
			) => {
				const user = request.server.requestUser(request);
				if (
					request.body.username &&
					request.body.username.toLowerCase() ===
						user.username.toLowerCase()
				) {
					// Is the user trying to set their username to... their username?
					return reply.status(request.server.codes.used).send({
						code: core.Utils.foldCodes.usernameOrEmailTaken,
						message: "You already have this username!",
					});
				}

				if (request.body.email && !core.emailer.active) {
					// Can we even try to update their email?
					return reply
						.status(request.server.codes.notImplemented)
						.send({
							code: core.Utils.foldCodes.emailerNotConfigured,
							message:
								"Emailer not configured. Unable to update email.",
						});
				}

				if (
					request.body.email &&
					request.body.email.toLowerCase() ===
						user.email.toLowerCase()
				) {
					// Are they already using the "new" email?
					return reply.status(request.server.codes.notAccepted).send({
						code: core.Utils.foldCodes.usernameOrEmailTaken,
						message: "You already have this email!",
					});
				}
			},
		],
		async handler(request: UpdateRequest, reply: FastifyReply) {
			const auth = fastify.requestUser(request);
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

			// We check if this was different in the above hook
			if (body.password) {
				const passwd = await handlePassword(core, body.password);
				if (typeof passwd !== "string") {
					return reply.status(passwd.httpCode).send(passwd.message);
				}

				update.password = passwd;
			}

			if (body.username) {
				const newUsername = await handleUsername(core, body.username);
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
				await core.db.updateUser(auth.id, update);
			} catch (error: unknown) {
				request.server.reportError(error, request, { user: auth });
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
	route,
} satisfies NeoRoute;
