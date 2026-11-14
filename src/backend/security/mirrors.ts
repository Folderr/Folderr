import * as Sentry from "@sentry/node";
import type { Buffer } from "buffer";
import jwt, { type Algorithm, JsonWebTokenError } from "jsonwebtoken";
import { ulid } from "ulidx";
import type { Core } from "../internals.js";
import type { SigningKeys } from "./keys.js";

// Handles all Mirror related functionality
export default class Mirrors {
	readonly #algorithms: Algorithm[];

	readonly #privKey: Buffer;

	readonly #pubKey: Buffer;

	readonly #core: Core;

	constructor(core: Core, keys: SigningKeys) {
		this.#core = core;
		this.#algorithms = ["PS256"];
		this.#privKey = keys.privateKey;
		this.#pubKey = keys.publicKey;
	}

	async genMirrorKey(
		url: string,
		mirrorURL: string,
	): Promise<{ key: string; id: string }> {
		const id = ulid();
		return {
			key: jwt.sign(
				{
					url,
					mirrorURL,
				},
				this.#privKey,
				{
					issuer: "folderr",
					jwtid: id,
					expiresIn: "1h",
					algorithm: this.#algorithms[0],
					audience: "mirror",
				},
			),
			id,
		};
	}

	verifyMirrorKey(
		message: {
			res: string;
			token: string;
		},
		id: string,
		url: string,
		mirrorURL: string,
	): boolean {
		try {
			const out = jwt.verify(message.token, this.#pubKey, {
				issuer: "folderr",
				algorithms: this.#algorithms,
				audience: "mirror",
			});
			return Boolean(
				out &&
					typeof out === "object" &&
					out.jti === id &&
					out.url === url &&
					out.mirrorURL === mirrorURL &&
					message.res === "Mirror Operational",
			);
		} catch (error: unknown) {
			if (error instanceof JsonWebTokenError) {
				return false;
			}
			throw new Error("Verifying the Mirror key failed", {
				cause: error,
			});
		}
	}
}
