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
import crypto from "crypto";
import type { FastifyRequest } from "fastify";
import * as ulid from "ulidx";
import { promisify } from "util";
import type { Core } from "../../internals.js";
import type { FoldCodesI } from "./fold-codes.js";
import { FoldCodes } from "./fold-codes.js";

type ApiResponse = {
	message: {
		message: string;
	};
};

const ajv = new AJV();

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

const apiparse = ajv.compileParser(apiresponse);

const sleep = promisify(setTimeout);
const generateKeyPair = promisify(crypto.generateKeyPair);

/**
 * @param {Folderr} core The Core of the project
 *
 * @classdesc A lot of utility functions
 */
class Utils {
	public foldCodes: FoldCodesI;

	readonly #core: Core;

	/** Whether the configured URL answered its last ping, and when that answer expires */
	#homeReachable?: { ok: Promise<boolean>; expires: number };

	/**
	 * @constructor
	 *
	 * @prop {Core} core The Folderr client
	 */
	constructor(core: Core) {
		this.#core = core;
		this.foldCodes = FoldCodes;
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
			this.#core.db.findFile({ id }),
			this.#core.db.findLink({ id }),
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
	 * Works out the base URL for links Folderr hands out.
	 * Uses the configured URL when the request came in on it, or when it answers a ping,
	 * otherwise the host the request came in on.
	 */
	async determineHomeURL(request: FastifyRequest): Promise<string> {
		const protocol = `${request.protocol || "http"}://`;
		let host: string | undefined;

		// The Host header only counts when it looks like a real domain or IP;
		// request.host keeps any port (127.0.0.1:8888), request.hostname drops it
		if (request.hostname?.split(".").length > 1) {
			host = request.host;
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
			const ok = this.#pingHome();
			// Shared while the ping is in flight. Once answered, a "yes" is trusted for
			// 15 minutes and a "no" is retried after 30 seconds.
			this.#homeReachable = { ok, expires: Number.POSITIVE_INFINITY };
			void ok.then((reachable) => {
				if (this.#homeReachable?.ok === ok) {
					this.#homeReachable.expires =
						Date.now() + (reachable ? 15 * 60_000 : 30_000);
				}
			});
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
