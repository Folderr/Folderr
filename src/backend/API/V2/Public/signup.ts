import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals";
import * as constants from "../../../Structures/constants/index";
import type { NeoRoute } from "../../../Structures/neo-route";
import { genValidationToken } from "../../../security/verification";

const path = "/signup";
const method = "POST";

type RouteTypes = {
	Body: {
		email: string;
		password: string;
		username: string;
	};
	Headers: {
		preferredURL?: string;
	};
};

async function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
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
						{
							code: 1016,
							message:
								constants.ENUMS.RESPONSES.TAKEN
									.USERNAME_OR_EMAIL,
						},
						{
							code: 1012,
							message:
								constants.ENUMS.RESPONSES.PASSWORD
									.PASSWORD_REQUIREMENTS,
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
						{
							code: 1062,
							message: "Failed to send verification email",
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
			request: FastifyRequest<RouteTypes>,
			response: FastifyReply,
		) {
			// 0 = closed, 1 = an admin approves each signup, 2 = verify by email.
			// Checked before anything else, so a closed instance doesn't reveal which
			// usernames or emails are taken
			const mode = core.config.signups;
			if (mode === 0) {
				return response.status(request.server.codes.forbidden).send({
					code: core.Utils.foldCodes.signupsClosed,
					message: "Signups are closed",
				});
			}

			if (mode === 2 && !core.emailer.active) {
				return response
					.status(request.server.codes.notImplemented)
					.send({
						code: core.Utils.foldCodes.emailerNotConfigured,
						message:
							"Signups verify by email, but email isn't set up",
					});
			}

			// Check user input
			const { email, username, password } = request.body;
			const userInput = await checkUserInput(core, request);
			if (typeof userInput !== "boolean") {
				return response
					.status(userInput.httpCode)
					.send(userInput.response);
			}

			// Generate a unique user ID
			const userId = core.Utils.genFolderrId();

			// Anything thrown from here goes to the error handler as a 500; it was once
			// caught and answered with 201 OK, so a failed signup looked like it worked
			const validationToken = await genValidationToken();
			const userInfo = {
				username,
				id: userId,
				password,
				email,
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
					: await noEmailSignup(userInfo, validationToken, request);

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
	request: FastifyRequest<RouteTypes>,
	_response: FastifyReply,
): Promise<{
	httpCode: 201;
	msg: {
		message: string;
		code: number;
	};
}> {
	let url = await request.server.utils.determineHomeURL(request);
	if (!/http(s)?:\/\//.test(url)) {
		url = `http://${url}`;
	}

	// Saved before the email goes out, so nobody gets a link to a signup that was never stored
	await request.server.db.makeVerify(userInfo, validationToken.hash); // Errors handled by Fastify handler

	try {
		await core.emailer.verifyEmail(
			userInfo.email,
			`${url}/account/verify/${userInfo.id}/${validationToken.token}`,
			userInfo.username,
		);
	} catch (error: unknown) {
		// Nobody can confirm a signup whose email never arrived, so don't let it hold the username and email
		await request.server.db.denySelf(userInfo.id);
		// Already an EmailError: the emailer wraps its own failures
		throw error;
	}

	core.logger.info(
		`New user (${userInfo.username} - ${userInfo.id}) signed up to Folderr`,
	);
	return {
		httpCode: request.server.codes.created,
		msg: {
			code: request.server.utils.foldCodes.emailSent,
			message: "OK",
		},
	};
}

async function noEmailSignup(
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
	request: FastifyRequest,
): Promise<{
	httpCode: 201;
	msg: { code: number; message: string };
}> {
	// The notification is saved with the pending user, and deleted when an admin verifies or denies them
	await request.server.db.makeVerify(userInfo, validationToken.hash, {
		id: request.server.utils.genNotifyID(),
		title: "New user signup!",
		content:
			`Username: ${userInfo.username}\n` +
			`User ID: ${userInfo.id}\n` +
			`Validation Token: ${validationToken.token}`,
	});

	request.log.info(
		`New user (${userInfo.username} - ${userInfo.id}) signed up to Folderr`,
	);
	return {
		httpCode: request.server.codes.created,
		msg: { code: request.server.codes.created, message: "OK" },
	};
}

async function checkUserInput(
	core: Core,
	request: FastifyRequest<RouteTypes>,
): Promise<
	| {
			httpCode: 400 | 403 | 409;
			response: {
				code: number;
				message: string;
			};
	  }
	| boolean
> {
	// Perform user input validation
	const { email, username, password } = request.body;
	const maxUsername = 12;
	const minUsername = 3;
	const uMatch = core.regexs.username.exec(username);
	// If the username length does not match criteria
	if (username.length > maxUsername || username.length < minUsername) {
		return {
			httpCode: request.server.codes.badReq,
			response: {
				code: request.server.utils.foldCodes.usernameSizeLimit,
				message: constants.ENUMS.RESPONSES.USERNAME.USERNAME_LENGTH,
			},
		};
	}

	// If the username does not match our username pattern
	if (!uMatch || (uMatch && username.length !== uMatch[0].length)) {
		return {
			httpCode: request.server.codes.badReq,
			response: {
				code: request.server.utils.foldCodes.illegalUsername,
				message:
					constants.ENUMS.RESPONSES.USERNAME
						.USERNAME_LETTER_REQUIREMENTS,
			},
		};
	}

	if (!core.emailer.validateEmail(email)) {
		return {
			httpCode: request.server.codes.badReq,
			response: {
				code: request.server.utils.foldCodes.badEmail,
				message: "Invalid or Unaccpetable Email!",
			},
		};
	}

	if (await request.server.db.isBanned(email)) {
		return {
			httpCode: request.server.codes.forbidden,
			response: {
				code: request.server.utils.foldCodes.bannedEmail,
				message: "Email banned!",
			},
		};
	}

	// Taken by an account or a pending signup, and for emails also an account's pending change
	const [usernameTaken, emailTaken] = await Promise.all([
		request.server.db.isUsernameTaken(username),
		request.server.db.isEmailTaken(email),
	]);
	if (usernameTaken || emailTaken) {
		return {
			httpCode: request.server.codes.conflict,
			response: {
				code: request.server.utils.foldCodes.usernameOrEmailTaken,
				message: constants.ENUMS.RESPONSES.TAKEN.USERNAME_OR_EMAIL,
			},
		};
	}

	// If the password is not over min length
	// If password does not match the regex completely
	const match = core.regexs.password.exec(password);
	if (!match || (match && match[0].length !== password.length)) {
		return {
			httpCode: request.server.codes.badReq,
			response: {
				code: request.server.utils.foldCodes.invalidPassword,
				message:
					constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS,
			},
		};
	}

	// No NUL character
	if (password.includes("\0")) {
		return {
			httpCode: request.server.codes.badReq,
			response: {
				code: request.server.utils.foldCodes.invalidPassword,
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
