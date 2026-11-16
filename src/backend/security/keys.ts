import { Buffer } from "buffer";
import crypto from "crypto";
import fs from "fs/promises";
import { join } from "path";
import process from "process";
import locations from "../../../internal/locations.json" with { type: "json" };
import type DBClass from "../Structures/Database/db-class";

export interface SigningKeys {
	readonly publicKey: Buffer;
	readonly privateKey: Buffer;
}

export class SecureCoreKeyError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, { cause: options?.cause });
		this.name = "SecureCoreKeyError";
	}
}

enum SecureCoreKeyErrorMessages {
	PRIVATE_KEY_LOAD = "SecureCore keys cannot be loaded without the private key",
	PUBLIC_KEY_LOAD = "SecureCore keys cannot be loaded without the public key",
	KEY_MISMATCH = "SecureCore private and public keys do not match",
}

export async function loadKeys(db: DBClass): Promise<SigningKeys> {
	let location = join(process.cwd(), "./internal/keys/privateJWT.pem");
	if (locations.keys !== "internal") {
		location = join(locations.keys, "privateJWT.pem");
	}
	let privateKey: Buffer | undefined;
	let publicKey: Buffer | undefined;
	if (locations.keys === "none" && process.env.PRIVATE_KEY) {
		privateKey = Buffer.from(process.env.PRIVATE_KEY);
	} else if (locations.keys === "none" && !process.env.PRIVATE_KEY) {
		throw new SecureCoreKeyError(
			SecureCoreKeyErrorMessages.PRIVATE_KEY_LOAD,
		);
	} else {
		try {
			privateKey = await fs.readFile(location);
		} catch (error: unknown) {
			throw new SecureCoreKeyError(
				SecureCoreKeyErrorMessages.PRIVATE_KEY_LOAD,
				{ cause: error },
			);
		}
	}

	try {
		const folderr = await db.fetchFolderr();
		publicKey = Buffer.from(folderr.publicKeyJWT);
	} catch (error: unknown) {
		throw new SecureCoreKeyError(
			SecureCoreKeyErrorMessages.PUBLIC_KEY_LOAD,
			{ cause: error },
		);
	}

	// Test that the keys are valid
	try {
		const data = crypto.publicEncrypt(
			publicKey,
			Buffer.from("Hi I'm Folderr!"),
		);
		crypto.privateDecrypt(privateKey, data);
	} catch (error: unknown) {
		throw new SecureCoreKeyError(SecureCoreKeyErrorMessages.KEY_MISMATCH, {
			cause: error,
		});
	}

	return { publicKey, privateKey };
}
