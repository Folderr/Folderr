import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Core } from "../../../internals";
import * as constants from "../../../Structures/constants/index";

export const path = "/signup";

export const enabled = true;

export const rewrites = "/signup";
export const method = "POST";

export async function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			/* eslint-disable @typescript-eslint/naming-convention */
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
				/* eslint-disable @typescript-eslint/naming-convention */
				"4xx": {
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
		async handler(
			request: FastifyRequest<{
				Body: {
					email: string;
					password: string;
					username: string;
				};
				Headers: {
					preferredURL?: string;
				}
			}>,
			response: FastifyReply
		) {
			// Check user input
			const { email, username, password } = request.body;
			const userInput = await checkUserInput(core, email, username, password);
			if (typeof userInput !== "boolean") {
				return response.status(userInput.httpCode).send(userInput.response);
			}

			// Generate a unique user ID
			const userID = await genUID(core);

			// Perform signup logic
			try {
				// Perform signup logic here
				const validationToken = await core.Utils.genValidationToken();
				const userInfo = {
					username,
					id: userID,
					password: password,
					email: email,
				};

				try {
					// Call the signup function based on the email server availability
					const result = core.emailer.active
						? await emailSignup(core, userInfo, validationToken, request, response)
						: await noEmailSignup(core, userInfo, validationToken, response);

					return response.status(result.httpCode).send(result.msg);
				} catch (error: unknown) {
					// Handle signup error
					return response.status(core.codes.internalErr).send({
						code: core.Utils.foldCodes.unkownError,
						message: "An internal error occurred while signing up!",
					});
				}
			} catch (error: unknown) {
				// Handle signup error
			}

			// Return success response
			return response.status(this.codes.created).send({
				code: this.codes.created,
				message: "OK",
			});
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
	response: FastifyReply
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
			userInfo.username
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

				await request.server.handleError(error, request, response, "fatal");
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
		`New user (${userInfo.username} - ${userInfo.id}) signed up to Folderr`
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
	response: FastifyReply
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
				"New user signup!"
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
		`New user (${userInfo.username} - ${userInfo.id}) signed up to Folderr`
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
	password: string
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
				message: constants.ENUMS.RESPONSES.USERNAME.USERNAME_LETTER_REQUIREMENTS,
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

	const bans = await core.db.fetchFolderr({});
	if (bans.bans.includes(email)) {
		return {
			httpCode: core.codes.forbidden,
			response: {
				code: core.Utils.foldCodes.bannedEmail,
				message: "Email banned!",
			},
		};
	}

	// See if the username is already taken. Fail if so.
	const user =
		(await core.db.findUser({ $or: [{ username }, { email }] })) ??
		(await core.db.findVerify({ $or: [{ username }, { email }] }));
	if (user) {
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
				message: constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS,
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

export default route;