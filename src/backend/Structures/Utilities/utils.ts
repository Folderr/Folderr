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

import { promisify } from "util";
import crypto from "crypto";
import buffer from "buffer";
import argon2 from "argon2";
import * as uuid from "uuid";
import type { JTDSchemaType } from "ajv/dist/jtd";
import AJV from "ajv/dist/jtd";
import type { FastifyRequest } from "fastify";
import type { User as UI, PendingMember, User } from "../Database/db-class";
import type { Core } from "../../internals";
import { Authorization } from "../../internals";
import * as constants from "../constants/index";
import type { FoldCodesI } from "./fold-codes";
import { FoldCodes } from "./fold-codes";

type MirrorResponse = {
	message: {
		res: string;
	};
};

type ApiResponse = {
	message: {
		message: string;
	};
};

const ajv = new AJV();

const msgschema: JTDSchemaType<MirrorResponse["message"]> = {
	properties: {
		res: { type: "string" },
	},
};

const mirrorschema: JTDSchemaType<MirrorResponse> = {
	properties: {
		message: msgschema,
	},
};

const apimsg: JTDSchemaType<ApiResponse["message"]> = {
	properties: {
		message: { type: "string" },
	},
};

const apiresponse: JTDSchemaType<ApiResponse> = {
	properties: {
		message: apimsg,
	},
};

const mirrorparse = ajv.compileParser(mirrorschema);
const apiparse = ajv.compileParser(apiresponse);

const sleep = promisify(setTimeout);
const generateKeyPair = promisify(crypto.generateKeyPair);

type TokenReturn = {
	token: string;
	hash: string;
};

/**
 * @param {Folderr} core The Core of the project
 *
 * @classdesc A lot of utility functions
 */
class Utils {
	public saltRounds: number;

	public byteSize: number;

	public authorization: Authorization;

	public foldCodes: FoldCodesI;

	readonly #core: Core;

	/**
	 * @constructor
	 *
	 * @prop {number} saltRounds The rounds to salt with
	 * @prop {number} byteSize The amount of random bytes to generate
	 * @prop {Core} core The Folderr client
	 */
	constructor(core: Core) {
		this.saltRounds = 10;
		this.byteSize = 48;
		this.#core = core;
		this.authorization = new Authorization(core);
		this.foldCodes = FoldCodes;
	}

	/**
	 * Checks a request for an authorization token
	 * @param {Object<FastifyRequest>} request The request to authenticate
	 * @param {Boolean} admin Whether or not to check if the user is an admin
	 * @returns {Object} Either code 200 and a user, or code 4XX and no user
	 */
	async checkAuth(
		request: FastifyRequest,
		admin?: boolean
	): Promise<{ code: 401 | 403 } | { code: 200; user: User }> {
		let account: User | void;
		if (request.headers.authorization) {
			account = await this.authorization.verifyAccount(
				request.headers.token
			);
		} else if (request.cookies.token) {
			account = await this.authorization.verifyAccount(
				request.cookies.token,
				{
					web: true,
				}
			);
		} else {
			return { code: 401 };
		}

		if (!account) {
			return { code: 401 };
		}

		if (admin && (!account.admin || !account.owner)) {
			return { code: 403 };
		}

		return { code: 200, user: account };
	}

	/**
	 * @desc Make Utils look pretty when inspected
	 *
	 * @returns {string}
	 */
	toString(): string {
		return "[Core Utils]";
	}

	/**
	 * @desc Wait for a certain time
	 * - Async/wait only
	 * @async
	 *
	 * @param {Number} ms The milliseconds to sleep for
	 * @returns {Promise<void>}
	 * @author KhaaZ
	 */
	// Taken from https://github.com/Khaazz/AxonCore/blob/d597089b80615fdd5ceab8f0a1b1d83f70fc5187/src/Utility/Utils.js#L355
	async sleep(ms: number): Promise<void> {
		await sleep(ms);
	}

	/**
	 * Generates a RSA2048 private & public key pair
	 * @param {string} [passphrase] The passphrase for the private key
	 */
	async genKeyPair(
		passphrase?: string
	): Promise<{ privateKey: string; publicKey: string }> {
		const privateKeyEncoding: {
			format: "pem";
			cipher?: string;
			passphrase?: string;
			type: "pkcs8";
		} = { format: "pem", type: "pkcs8" };
		if (passphrase) {
			privateKeyEncoding.cipher = "aes256";
			privateKeyEncoding.passphrase = passphrase;
		}

		return generateKeyPair("rsa", {
			modulusLength: 2048,
			publicKeyEncoding: {
				format: "pem",
				type: "spki",
			},
			privateKeyEncoding,
		});
	}

	/**
	 * @desc Generate a user ID
	 * @generator
	 *
	 * @returns {Promise<string>}
	 */
	async genUid(): Promise<string> {
		// Minimum and max id length
		const max = 22;
		const min = 18;
		// What is wut??
		const wut = 1;
		// Pick between 18 and 22
		const number = Math.floor(Math.random() * (max - min + wut)) + min;
		let userid = "";
		// Min and max numbers
		const maxChar = 9;
		const minChar = 1;
		// Generate the user ID
		for (let i = 0; i < number; i++) {
			userid += String(
				Math.floor(Math.random() * (maxChar - minChar + wut)) + minChar
			);
		}

		return userid;
	}

	/**
	 *
	 * Generate a ID using uuid
	 */
	genV4uuid(): string {
		return uuid.v4();
	}

	validateUuid(id: string, version: 4 | 5) {
		if (version === 5 && uuid.version(id) === 5 && uuid.validate(id)) {
			return true;
		}

		return version === 4 && uuid.version(id) === 4 && uuid.validate(id);
	}

	/**
	 * @desc Generate a ID
	 * @generator
	 *
	 * @returns {Promise<string>}
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	async genID(): Promise<string> {
		// Generate a random ID
		const bytesToGen = 10;
		const min = 4;
		const max = 10;
		const id = crypto
			.randomBytes(bytesToGen)
			.toString("base64")
			.replace(/[+/=\\]/g, "")
			.slice(min, max);
		let toReturn = true;
		const [upload, link] = await Promise.all([
			this.#core.db.findFile({ id }, "id"),
			this.#core.db.findLink({ id }, "id"),
		]);
		if (upload ?? link) {
			toReturn = false;
		}

		if (!toReturn) {
			return this.genID();
		}

		return id;
	}

	/**
	 * @desc Hash a password
	 * @async
	 *
	 * @param {string} password The password to hash
	 * @returns {string}
	 */
	async hashPass(password: string): Promise<string> {
		// Minimum and max password lengths
		const minPass = 8;
		const maxPass = 256;
		// If the password is not over min length
		// If password does not match the regex completely
		const match: boolean = this.#core.regexs.password.test(password);
		if (password.length < minPass || !match) {
			throw new Error( // eslint disable-next-line max-len
				`[PSW1] ${constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS}`
			);
		}

		// If the password is too long
		if (password.length > maxPass) {
			throw new Error(
				`[PSW2] ${constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_LENGTH_EXCEED}`
			);
		}

		if (password.includes("\0")) {
			throw new Error(
				`[PSW3] ${constants.ENUMS.RESPONSES.PASSWORD.NO_NUL}`
			);
		}

		// Hash and return
		return argon2.hash(password, { timeCost: this.saltRounds });
	}

	/**
	 * @desc Generate a notification ID
	 * @generator
	 * @async
	 *
	 * @returns {Promise<string|Promise<*>>}
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	async genNotifyID(): Promise<string> {
		// Gen the ID, and dont let the ID equal a already made notify id
		const id: string = await this.genUid();
		const notify = await this.#core.db.findAdminNotify({ id });
		if (notify) {
			// Retry if notify exists
			return this.genNotifyID();
		}

		// Return the ID
		return id;
	}

	/**
	 * @desc Generate a validation token
	 * @generator
	 * @async
	 *
	 * @returns {Promise<{hash: string, token: string}>}
	 */
	async genValidationToken(): Promise<TokenReturn> {
		// Generate random bytes, gen more random bytes
		// Oh and get a base64 date in milliseconds
		const r: string = crypto.randomBytes(this.byteSize).toString();
		const random: string = crypto
			.randomBytes(this.byteSize)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		const userid = buffer.Buffer.from(r)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		const date = buffer.Buffer.from(
			new Date().getUTCMilliseconds().toString()
		)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		// Combine, hash, and return the hashed and unhashed token
		const token = `${userid}-${random}-${date}`;
		const hash = await argon2.hash(token, { timeCost: this.saltRounds });
		return { token, hash };
	}

	async genWebValidationToken(): Promise<TokenReturn> {
		// Generate random bytes, gen more random bytes
		// Oh and get a base64 date in milliseconds
		const r: string = crypto.randomBytes(this.byteSize).toString();
		const random: string = crypto
			.randomBytes(this.byteSize)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		buffer.Buffer.from(r)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		// Combine, hash, and return the hashed and unhashed token
		const token = `${random}`;
		const hash = await argon2.hash(token, { timeCost: this.saltRounds });
		return { token, hash };
	}

	/**
	 * @desc Authenticate a user using password and username
	 * @async
	 *
	 * @param {Request} request The request.
	 * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
	 *
	 * @returns {Promise<boolean>}
	 */
	async authPassword(
		request: FastifyRequest,
		fn?: (arg0: UI) => boolean
	): Promise<UI | false> {
		// Make sure all of the auth stuff is there
		if (!request.headers.password && !request.headers.username) {
			return false;
		}

		if (!request.headers.password || !request.headers.username) {
			return false;
		}

		// Make sure the auth is not an array. Arrays are bad for auth
		if (
			Array.isArray(request.headers.password) ||
			Array.isArray(request.headers.username)
		) {
			return false;
		}

		const user = await this.#core.db.findUser({
			username: request.headers.username,
		});
		if (!user) {
			return false;
		}

		const verify = await argon2.verify(
			user.password,
			request.headers.password
		);
		if (!verify) {
			return false;
		}

		// If the custom function exists
		if (fn) {
			const funcOut = fn(user); // Run the custom function (boolean)
			if (!funcOut) {
				return false;
			}
		}

		// Return the user
		return user;
	}

	/**
	 * @desc Determines if the user allows insecuce requests
	 * @param request Fastify request
	 *
	 * @returns {boolean}
	 */
	verifyInsecureCookies(request: FastifyRequest): boolean {
		if (!request.cookies) {
			return false;
		}

		if (!request.cookies.i) {
			return false;
		}

		return request.cookies.i === "t";
	}

	/**
	 * @desc Find and return a verifying user from the schema if any
	 * @async
	 *
	 * @param {String} validationToken The validation token to search for
	 * @param {String} userID The user IDs to look for
	 * @returns {Promise<boolean>}
	 */
	async findVerifying(
		validationToken: string,
		userID: string
	): Promise<PendingMember | false> {
		const user: PendingMember | undefined = await this.#core.db.findVerify({
			id: userID,
		});
		if (!user) {
			return false;
		}

		if (!(await argon2.verify(user.validationToken, validationToken))) {
			return false;
		}

		return user;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	async testMirrorURL(url: string): Promise<boolean> {
		try {
			const test = await this.#core.got.get<MirrorResponse>(
				`${url}/api`,
				{
					responseType: "json",
					parseJson: mirrorparse,
				}
			);
			if (!test?.body) {
				return false;
			}

			return test.body.message.res === "Pong! Mirror Operational!";
		} catch {
			return false;
		}
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	async determineHomeURL(request: FastifyRequest): Promise<string> {
		const protocol = `${request.protocol || "http"}://`;
		let host;

		// In the event of a correctly formatted hostname, set host to it
		if (request.hostname?.split(".").length > 1) {
			host = request.hostname;
		}

		if (!host) {
			host = this.#core.config.url;
			if (host?.includes("://")) host = host.split("://")[1];
			return `${protocol}${host}`;
		}

		if (host === this.#core.config.url.split("://")[1]) {
			return `${this.#core.config.url}`;
		}

		try {
			const test = await this.#core.got.get<ApiResponse>(
				`${this.#core.config.url}/api/`,
				{
					responseType: "json",
					parseJson: apiparse,
					timeout: {
						// 2 second timeout should do the trick.
						request: 2000,
					},
				}
			);
			if (!test) {
				return `${protocol}${host}`;
			}

			if (test.body.message.message === "Pong!") {
				return this.#core.config.url;
			}

			return `${protocol}${host}`;
		} catch {
			return `${protocol}${host}`;
		}
	}
}

export default Utils;
