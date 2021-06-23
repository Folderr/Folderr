import locations from '../../internal/locations.json';
import {join} from 'path';
import AbstractDB from '../Structures/Database/db-class';
import fs from 'fs/promises';

export default class AuthKeyHandler {
	#publicKey?: Buffer;
	#privateKey?: Buffer;
	#location: string;

	constructor() {
		this.#location = join(process.cwd(), './internal/key/privateJWT.pem');
		if (locations.keys !== 'internal') {
			this.#location = locations.keys;
		}
	}

	async fetchKeys(db: AbstractDB): Promise<void> {
		this.#privateKey = await fs.readFile(this.#location);
		const folderr = await db.fetchFolderr();
		this.#publicKey = folderr.publicKeyJWT;
	}

	get privateKey() {
		return this.#privateKey;
	}

	get publicKey() {
		return this.#publicKey;
	}
}
