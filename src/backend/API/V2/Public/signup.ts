import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals";
import * as constants from "../../../Structures/constants/index";
import type { NeoRoute } from "../../../Structures/neo-route";

const path = "/signup";
const method = "POST";

async function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["public"],
			summary: "Signup for Folderr",
			description:
				"Signs up for Folderr, following the instance's signups setting: closed (refused), admin approval, or verification by email. The account exists once it's verified",
			body: {
				type: "object",
				properties: {
					email: { type: "string" },
					username: { type: "string" },
					password: { type: "string" },
				},
				required: ["email", "username", "password"],
			},
			response: {
				"4xx": {
					examples: [
						{ code: 1063, message: "Signups are closed" },
						{
							code: 400,
							message: "body must have required property 'email'",
						},
						{
							code: 1018,
							message:
								"Username must be between 3 and 12 characters!",
						},
						{
							code: 1058,
							message: "Invalid or Unaccpetable Email!",
						},
						{ code: 1016, message: "Username or email taken!" },
						{
							code: 1012,
							message:
								'Password must be 8-32 characters long, must contain 1 uppercase and lowercase letter, and 1 digit. Password may contain "_", "&", "."',
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
						{ code: 201, message: "OK" },
						{ code: 1061, message: "OK" },
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
							code: 1059,
							message:
								"Signups verify by email, but email isn't set up",
						},
						{ code: 1062, message: "Email failed to send" },
						{
							code: 1052,
							message:
								"An internal error occurred while signing up!",
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		async handler(
			request: FastifyRequest<{
				Body: {
					email: string;
					password: string;
					username: string;
				};
				Headers: {
					preferredURL?: string;
				};
			}>,
			response: FastifyReply,
		) {
			// 0 = closed, 1 = an admin approves each signup, 2 = verify by email.
			// Checked before anything else, so a closed instance doesn't reveal which
			// usernames or emails are taken
			const mode = core.config.signups;
			if (mode === 0) {
				return response.status(core.codes.forbidden).send({
					code: core.Utils.foldCodes.signupsClosed,
					message: "Signups are closed",
				});
			}

			if (mode === 2 && !core.emailer.active) {
				return response.status(core.codes.notImplemented).send({
					code: core.Utils.foldCodes.emailerNotConfigured,
					message: "Signups verify by email, but email isn't set up",
				});
			}

			// Check user input
			const { email, username, password } = request.body;
			const userInput = await checkUserInput(
				core,
				email,
				username,
				password,
			);
			if (typeof userInput !== "boolean") {
				return response
					.status(userInput.httpCode)
					.send(userInput.response);
			}

			// Generate a unique user ID
			const userID = await genUID(core);

			// Anything thrown from here goes to the error handler as a 500; it was once
			// caught and answered with 201 OK, so a failed signup looked like it worked
			const validationToken = await core.Utils.genValidationToken();
			const userInfo = {
				username,
				id: userID,
				password: password,
				email: email,
			};

			// The signup waits for either the user (by email) or an admin to verify it
			const result =
				mode === 2
					? await emailSignup(
							core,
							userInfo,
							validationToken,
							request,
							response,
						)
					: await noEmailSignup(
							core,
							userInfo,
							validationToken,
							response,
						);

			return response.status(result.httpCode).send(result.msg);
		},
	});
	fastify.log.info(undefined, `Initialized POST Signup at ${path}`);
}

async function emailSignup(
	core: Core,
	userInfo: {
		username: string;
		id: string;
		password: string;
		email: string;
	},
	validationToken: {
		hash: string;
		token: string;
	},
	request: FastifyRequest<{
		Headers: {
			preferredURL?: string;
		};
	}>,
	_response: FastifyReply,
): Promise<{
	httpCode: 500 | 201;
	msg: {
		message: string;
		code: number;
	};
}> {
	let url = await core.Utils.determineHomeURL(request);
	if (!/http(s)?:\/\//.test(url)) {
		url = `http://${url}`;
	}

	try {
		await core.emailer.verifyEmail(
			userInfo.email,
			`${url}/account/verify/${userInfo.id}/${validationToken.token}`,
			userInfo.username,
		);
		await core.db.makeVerify(userInfo, validationToken.hash);
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error instanceof Error) {
				if (error.message.includes("Connection timeout")) {
					return {
						httpCode: core.codes.internalErr,
						msg: {
							code: core.Utils.foldCodes.emailFailed,
							message: "Email failed to send",
						},
					};
				}

				// Report only; the caller sends the response below
				request.server.reportError(error, request);
			}

			return {
				httpCode: core.codes.internalErr,
				msg: {
					code: core.Utils.foldCodes.unkownError,
					message: "An internal error occurred while signing up!",
				},
			};
		}

		return {
			httpCode: core.codes.internalErr,
			msg: {
				code: core.Utils.foldCodes.unkownError,
				message: "An internal error occurred while signing up!",
			},
		};
	}

	core.logger.info(
		`New user (${userInfo.username} - ${userInfo.id}) signed up to Folderr`,
	);
	return {
		httpCode: core.codes.created,
		msg: {
			code: core.Utils.foldCodes.emailSent,
			message: "OK",
		},
	};
}

async function noEmailSignup(
	core: Core,
	userInfo: {
		username: string;
		id: string;
		password: string;
		email: string;
	},
	validationToken: {
		hash: string;
		token: string;
	},
	_response: FastifyReply,
): Promise<{
	httpCode: 500 | 201;
	msg: { code: number; message: string };
}> {
	const notifyID = core.Utils.genNotifyID();
	try {
		await Promise.all([
			core.db.makeVerify(userInfo, validationToken.hash),
			core.db.makeAdminNotify(
				notifyID,
				`Username: ${userInfo.username}\n` +
					`User ID: ${userInfo.id}\n` +
					`Validation Token: ${validationToken.token}`,
				"New user signup!",
			),
		]);
	} catch (error: unknown) {
		if (error instanceof Error) {
			// Handle signup error
		}

		return {
			httpCode: core.codes.internalErr,
			msg: {
				code: core.Utils.foldCodes.unkownError,
				message: "An internal error occurred while signing up!",
			},
		};
	}

	core.logger.info(
		`New user (${userInfo.username} - ${userInfo.id}) signed up to Folderr`,
	);
	return {
		httpCode: core.codes.created,
		msg: { code: core.codes.created, message: "OK" },
	};
}

async function genUID(core: Core): Promise<string> {
	// Generate an ID, and do not allow a user's ID to be reused
	const uID = core.Utils.genFolderrId();
	const user = await core.db.findUser({ id: uID });
	if (user) {
		// Handle ID collision
	}

	// Return user ID
	return uID;
}

async function checkUserInput(
	core: Core,
	email: string,
	username: string,
	password: string,
): Promise<
	| {
			httpCode: number;
			response: {
				code: number;
				message: string;
			};
	  }
	| boolean
> {
	// Perform user input validation
	const maxUsername = 12;
	const minUsername = 3;
	const uMatch = core.regexs.username.exec(username);
	// If the username length does not match criteria
	if (username.length > maxUsername || username.length < minUsername) {
		return {
			httpCode: core.codes.badReq,
			response: {
				code: core.Utils.foldCodes.usernameSizeLimit,
				message: constants.ENUMS.RESPONSES.USERNAME.USERNAME_LENGTH,
			},
		};
	}

	// If the username does not match our username pattern
	if (!uMatch || (uMatch && username.length !== uMatch[0].length)) {
		return {
			httpCode: core.codes.badReq,
			response: {
				code: core.Utils.foldCodes.illegalUsername,
				message:
					constants.ENUMS.RESPONSES.USERNAME
						.USERNAME_LETTER_REQUIREMENTS,
			},
		};
	}

	if (!core.emailer.validateEmail(email)) {
		return {
			httpCode: core.codes.badReq,
			response: {
				code: core.Utils.foldCodes.badEmail,
				message: "Invalid or Unaccpetable Email!",
			},
		};
	}

	if (await core.db.isBanned(email)) {
		return {
			httpCode: core.codes.forbidden,
			response: {
				code: core.Utils.foldCodes.bannedEmail,
				message: "Email banned!",
			},
		};
	}

	// Taken by an account or a pending signup, and for emails also an account's pending change
	const [usernameTaken, emailTaken] = await Promise.all([
		core.db.isUsernameTaken(username),
		core.db.isEmailTaken(email),
	]);
	if (usernameTaken || emailTaken) {
		return {
			httpCode: core.codes.forbidden,
			response: {
				code: core.Utils.foldCodes.usernameOrEmailTaken,
				message: "Username or email taken!",
			},
		};
	}

	// If the password is not over min length
	// If password does not match the regex completely
	const match = core.regexs.password.exec(password);
	if (!match || (match && match[0].length !== password.length)) {
		return {
			httpCode: core.codes.badReq,
			response: {
				code: core.Utils.foldCodes.invalidPassword,
				message:
					constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS,
			},
		};
	}

	// No NUL character
	if (password.includes("\0")) {
		return {
			httpCode: core.codes.badReq,
			response: {
				code: core.Utils.foldCodes.invalidPassword,
				message: constants.ENUMS.RESPONSES.PASSWORD.NO_NUL,
			},
		};
	}

	return true;
}

export default {
	path,
	method,
	enabled: true,
	route,
} satisfies NeoRoute;
