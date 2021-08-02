import {join} from 'path';
import fs from 'fs/promises';
import locations from '../../internal/locations.json';
import AbstractDB from '../Structures/Database/db-class';

export default class AuthKeyHandler {
	#publicKey?: Buffer;
	#privateKey?: Buffer;
	#location: string;

	constructor() {
		this.#location = join(process.cwd(), './internal/keys/privateJWT.pem');
		if (locations.keys !== 'internal') {
			this.#location = locations.keys;
		}
	}

	async fetchKeys(db: AbstractDB): Promise<void> {
		try {
			this.#privateKey = await fs.readFile(this.#location);
			const folderr = await db.fetchFolderr();
			this.#publicKey = folderr.publicKeyJWT;
		} catch (error: unknown) {
			console.log(error);
			throw new Error('Unable to fetch keys');
		}
	}

	get privateKey() {
		return this.#privateKey;
	}

	get publicKey() {
		return this.#publicKey;
	}
}
