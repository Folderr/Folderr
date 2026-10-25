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

import type { JTDSchemaType } from "ajv/dist/jtd.js";
import AJV from "ajv/dist/jtd.js";
import argon2 from "argon2";
import buffer from "buffer";
import crypto from "crypto";
import type { LookupAddress, LookupOptions } from "dns";
import { Resolver } from "dns";
import type { FastifyRequest } from "fastify";
import type { Options } from "got";
import { BlockList, isIP } from "net";
import * as ulid from "ulidx";
import { promisify } from "util";
import type { Core } from "../../internals.js";
import { Authorization } from "../../internals.js";
import * as constants from "../constants/index.js";
import type { PendingMember, User as UI, User } from "../Database/db-class.js";
import type { FoldCodesI } from "./fold-codes.js";
import { FoldCodes } from "./fold-codes.js";

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

	readonly #resolver: Resolver;

	readonly #ipBlocklist: BlockList;

	/** Whether the configured URL answered its last ping, and when that answer expires */
	#homeReachable?: { ok: Promise<boolean>; expires: number };

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
		this.#resolver = new Resolver({ timeout: 2000, tries: 2 }); // Hey! We got stuff to do! No hanging the thread.
		this.#resolver.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8"]);

		// Addresses a user-supplied URL must never be allowed to reach.
		// BlockList also matches IPv4-mapped IPv6 addresses against the IPv4 ranges.
		this.#ipBlocklist = new BlockList();
		for (const [address, prefix] of [
			["0.0.0.0", 8], // "this" network
			["10.0.0.0", 8], // private
			["100.64.0.0", 10], // carrier-grade NAT
			["127.0.0.0", 8], // loopback
			["169.254.0.0", 16], // link-local, including cloud metadata
			["172.16.0.0", 12], // private
			["192.0.0.0", 24], // IETF protocol assignments
			["192.168.0.0", 16], // private
			["198.18.0.0", 15], // benchmarking
			["224.0.0.0", 4], // multicast
			["240.0.0.0", 4], // reserved, including broadcast
		] as const) {
			this.#ipBlocklist.addSubnet(address, prefix, "ipv4");
		}

		for (const [address, prefix] of [
			["::", 128], // unspecified
			["::1", 128], // loopback
			["fc00::", 7], // unique local
			["fe80::", 10], // link-local
			["ff00::", 8], // multicast
		] as const) {
			this.#ipBlocklist.addSubnet(address, prefix, "ipv6");
		}
	}

	/**
	 * Checks a request for an authorization token
	 * @param {Object<FastifyRequest>} request The request to authenticate
	 * @param {Boolean} admin Whether or not to check if the user is an admin
	 * @returns {Object} Either code 200 and a user, or code 4XX and no user
	 */
	async checkAuth(
		request: FastifyRequest,
		admin?: boolean,
		owner?: boolean,
	): Promise<{ code: 401 | 403 } | { code: 200; user: User }> {
		let account: User | void;
		if (request.headers.authorization) {
			account = await this.authorization.verifyAccount(
				request.headers.authorization,
				{
					fn: (user) => !user.markedForDeletion,
				},
			);
		} else if (request.cookies.token) {
			account = await this.authorization.verifyAccount(
				request.cookies.token,
				{
					web: true,
					fn: (user) => !user.markedForDeletion,
				},
			);
		} else {
			return { code: 401 };
		}

		if (!account) {
			return { code: 401 };
		}

		if (admin && !account.admin && !account.owner) {
			return { code: 403 };
		}

		if (owner && !account.owner) {
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

	/** Strict IP checking */
	isIPHost(rawUrl: string): boolean {
		const { hostname } = new URL(rawUrl); // throws on an invalid URL
		return isIP(hostname.replace(/^\[|\]$/g, "")) !== 0; // IPv6 keeps its [brackets]
	}

	/**
	 * A `dns.lookup` replacement for user-supplied URLs, for `got`'s `lookup` option.
	 * Resolves through public resolvers, so internal-only names (`localhost`, `mongo`) don't
	 * resolve, and rejects any name with an address in the blocklist.
	 * Every failure is reported as ENOTFOUND or EBLOCKED.
	 *
	 * IP literals never reach a lookup, so check those with `isIPHost`.
	 */
	noPrivateDnsLookup = (
		hostname: string,
		options: LookupOptions,
		cb: (
			err: NodeJS.ErrnoException | null,
			address: string | LookupAddress[],
			family?: number,
		) => void,
	): void => {
		const family =
			options.family === 6 || options.family === "IPv6"
				? 6
				: options.family === 4 || options.family === "IPv4"
					? 4
					: 0;
		const methods: Array<"resolve4" | "resolve6"> =
			family === 4
				? ["resolve4"]
				: family === 6
					? ["resolve6"]
					: ["resolve4", "resolve6"];
		const fail = (err: NodeJS.ErrnoException) =>
			options.all ? cb(err, []) : cb(err, "", 0);

		const found: LookupAddress[] = [];
		let pending = methods.length;

		for (const method of methods) {
			this.#resolver[method](hostname, (_err, addresses) => {
				// An error or an empty answer just means no records of this family
				for (const address of addresses ?? []) {
					found.push({
						address,
						family: method === "resolve4" ? 4 : 6,
					});
				}

				if (--pending > 0) {
					return;
				}

				if (found.length === 0) {
					return fail(
						Object.assign(new Error(`ENOTFOUND ${hostname}`), {
							code: "ENOTFOUND",
							hostname,
						}),
					);
				}

				if (
					found.some((a) =>
						this.#ipBlocklist.check(
							a.address,
							a.family === 6 ? "ipv6" : "ipv4",
						),
					)
				) {
					return fail(
						Object.assign(new Error("URL DISALLOWED"), {
							code: "EBLOCKED",
						}),
					);
				}

				return options.all
					? cb(null, found)
					: cb(null, found[0].address, found[0].family);
			});
		}
	};

	/**
	 * Generates a RSA2048 private & public key pair
	 * @param {string} [passphrase] The passphrase for the private key
	 */
	async genKeyPair(
		passphrase?: string,
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
	 * @deprecated Please use genFolderrId
	 * @returns {Promise<string>}
	 */
	async genUid(): Promise<string> {
		// Minimum and max id length
		const max = 22;
		const min = 18;
		// What is wut??
		const pad = 1;
		// Pick between 18 and 22
		const number = Math.floor(Math.random() * (max - min + pad)) + min;
		let userid = "";
		// Min and max numbers
		const maxChar = 9;
		const minChar = 1;
		// Generate the user ID
		for (let i = 0; i < number; i++) {
			userid += String(
				Math.floor(Math.random() * (maxChar - minChar + pad)) + minChar,
			);
		}

		return userid;
	}

	genFolderrId(): string {
		return ulid.ulid();
	}

	isValidFolderrId(id: string): boolean {
		return ulid.isValid(id);
	}

	/**
	 * @desc Generate a ID
	 * @generator
	 *
	 * @returns {Promise<string>}
	 */
	async genShortId(): Promise<string> {
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
			return this.genShortId();
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
			throw new Error(
				`[PSW1] ${constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS}`,
			);
		}

		// If the password is too long
		if (password.length > maxPass) {
			throw new Error(
				`[PSW2] ${constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_LENGTH_EXCEED}`,
			);
		}

		if (password.includes("\0")) {
			throw new Error(
				`[PSW3] ${constants.ENUMS.RESPONSES.PASSWORD.NO_NUL}`,
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
	 * @returns {string}
	 */
	genNotifyID(): string {
		return this.genFolderrId();
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
		const random: string = crypto
			.randomBytes(this.byteSize)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		const date = buffer.Buffer.from(
			(Date.now() / 1000).toFixed(0).toString(),
		)
			.toString("base64")
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, "_");
		// Combine, hash, and return the hashed and unhashed token
		const token = `${random}_${date}`;
		const hash = await argon2.hash(token, { timeCost: this.saltRounds });
		return { token, hash };
	}

	async genWebValidationToken(): Promise<TokenReturn> {
		// Generate random bytes, gen more random bytes
		// Oh and get a base64 date in milliseconds
		const random: string = crypto
			.randomBytes(this.byteSize)
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
		fn?: (arg0: UI) => boolean,
	): Promise<UI | false> {
		// Make sure all of the auth stuff is there
		if (!request.headers.password || !request.headers.username) {
			this.#core.logger.debug(
				"Failed to authenticate user, missing headers.",
			);
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
			markedForDeletion: false,
		});
		if (!user) {
			return false;
		}

		const verify = await argon2.verify(
			user.password,
			request.headers.password,
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
		userID: string,
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

	async testMirrorURL(url: string): Promise<boolean> {
		try {
			const test = await this.#core.got.get<MirrorResponse>(
				`${url}/api`,
				{
					// We can't wait forever to send a response
					responseType: "json",
					parseJson: mirrorparse,
					lookup: this
						.noPrivateDnsLookup as unknown as Options["lookup"],
					maxRedirects: 1, // In case of HTTP to HTTPS upgrade
					hooks: {
						beforeRedirect: [
							(options) => {
								if (this.isIPHost(options.url.href)) {
									throw new Error("URL DISALLOWED");
								}
							},
						],
					},
					timeout: 1000,
					retry: 1,
				},
			);
			if (!test?.body) {
				return false;
			}

			return test.body.message.res === "Pong! Mirror Operational!";
		} catch {
			return false;
		}
	}

	/**
	 * Works out the base URL for links Folderr hands out.
	 * Uses the configured URL when the request came in on it, or when it answers a ping,
	 * otherwise the host the request came in on.
	 */
	async determineHomeURL(request: FastifyRequest): Promise<string> {
		const protocol = `${request.protocol || "http"}://`;
		let host: string | undefined;

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

		// Only whether the configured URL answers is cached, never a URL built from
		// a request, so one request's Host header can't leak into other users' links.
		// Requests that arrive while a ping is in flight share it.
		if (!this.#homeReachable || this.#homeReachable.expires <= Date.now()) {
			this.#homeReachable = {
				ok: this.#pingHome(),
				expires: Date.now() + 3_600_000,
			};
		}

		return (await this.#homeReachable.ok)
			? this.#core.config.url
			: `${protocol}${host}`;
	}

	/** Whether the configured URL answers as this Folderr instance */
	async #pingHome(): Promise<boolean> {
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
					retry: 0,
				},
			);
			return test?.body?.message.message === "Pong!";
		} catch {
			return false;
		}
	}
}

export default Utils;
