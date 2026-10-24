import { Buffer } from "buffer";
import fs from "fs/promises";
import { join } from "path";
import process from "process";
import locations from "../../../internal/locations.json" with { type: "json" };
import type AbstractDB from "../Structures/Database/db-class.js";

export default class AuthKeyHandler {
	#publicKey?: Buffer;
	#privateKey?: Buffer;
	#location: string;

	constructor() {
		this.#location = join(process.cwd(), "./internal/keys/privateJWT.pem");
		if (locations.keys !== "internal") {
			this.#location = locations.keys;
		}
	}

	async fetchKeys(db: AbstractDB): Promise<void> {
		try {
			if (locations.keys === "none" && process.env.PRIVATE_KEY) {
				this.#privateKey = Buffer.from(process.env.PRIVATE_KEY);
			} else if (locations.keys === "none" && !process.env.PRIVATE_KEY) {
				throw new Error(
					"You Need to Pass the Secret Key with an Environment Variable",
				);
			} else {
				this.#privateKey = await fs.readFile(this.#location);
			}

			const folderr = await db.fetchFolderr();
			this.#publicKey = Buffer.from(folderr.publicKeyJWT.buffer);
			if (locations.keys === "none") {
				const crypto = await import("crypto");
				try {
					const data = crypto.publicEncrypt(
						this.#publicKey,
						Buffer.from("Hi I'm Folderr!"),
					);
					const decrypted = crypto.privateDecrypt(
						this.#privateKey,
						data,
					);
					if (decrypted.toString() !== "Hi I'm Folderr!") {
						throw new Error(
							"Private and public keys do not match.",
						);
					}
				} catch (error: unknown) {
					throw new Error("Private and Public Keys Do Not Match.", {
						cause: error,
					});
				}
			}
		} catch (error: unknown) {
			if (
				error instanceof Error &&
				error.message ===
					"You Need to Pass the Secret Key with an Environment Variable"
			) {
				throw new Error(
					"You Need to Pass the Secret Key with an Environment Variable",
					{ cause: error },
				);
			}

			if (
				error instanceof Error &&
				error.message === "Private and Public Keys Do Not Match."
			) {
				throw new Error("Private and Public Keys Do Not Match.", {
					cause: error,
				});
			}

			console.log(error);
			throw new Error("Unable to fetch keys", { cause: error });
		}
	}

	get privateKey() {
		return this.#privateKey;
	}

	get publicKey() {
		return this.#publicKey;
	}
}
