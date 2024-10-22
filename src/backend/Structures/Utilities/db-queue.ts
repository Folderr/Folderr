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

import { EventEmitter } from "events";
import type { DbConfig } from "../../handlers/config-handler.js";
import Configurer from "../../handlers/config-handler.js";
import type { Upload } from "../Database/db-class.js";
import type DB from "../Database/db-class.js";
import MongoDB from "../Database/mongoose-db.js";
import { logger } from "../../internals.js";
import fs from "node:fs";

/**
 * @classdesc Handles deleting files
 */
export default class DbQueue extends EventEmitter {
	public onGoing: boolean;

	private readonly config: DbConfig;

	readonly #db: DB;

	readonly #loopBound: () => Promise<void>;

	readonly #queue: Set<string>;

	constructor(db?: DB) {
		super();
		this.onGoing = false;
		this.config = Configurer.verifyFetch().db;
		this.#db = db ?? new MongoDB();
		if (!db) {
			this.#db.init(this.config.url).catch((error) => {
				logger.error("CANNOT RUN DBQueue - Database Error");
				this.onGoing = false;

				if (error instanceof Error) {
					logger.debug(error.message);
					throw error;
				}

				throw new Error("CANNOT RUN DBQueue - Database Error");
			});
		}

		this.#loopBound = this.loop.bind(this);
		this.on("start", this.#loopBound);
		this.#queue = new Set();
	}

	add(id: string): boolean {
		this.#queue.add(id);
		if (!this.onGoing) {
			this.onGoing = true;
			this.emit("start");
			return true;
		}

		return true;
	}

	/**
	 * New method to remove all files
	 * @param {Upload[]} files What files to delete
	 * @param {string} userID The user to delete
	 */
	private async newRemoveFiles(
		files: Upload[],
		userID: string
	): Promise<void> {
		const deletions: Array<Promise<void>> = [];
		files.forEach((file) => {
			if (fs.existsSync(file.path)) {
				deletions.push(fs.promises.unlink(file.path));
			}
		});
		await Promise.all(deletions);
		await this.#db.purgeFiles({ owner: userID }, files.length);
		await this.#db.purgeUser(userID);
		await this.#db.purgeTokens(userID);
	}

	private async loop(): Promise<void> {
		if (this.#queue.size === 0) {
			this.onGoing = false;
			this.emit("stopped");
			return;
		}

		this.#queue.forEach(async (value) => {
			const files = await this.#db.findFiles(
				{ owner: value },
				{ selector: "id, path" }
			);
			if (files.length > 0) {
				await this.newRemoveFiles(files, value);
				this.#queue.delete(value);
			} else {
				await this.#db.purgeUser(value);
				await this.#db.purgeTokens(value);
				this.#queue.delete(value);
			}
		});

		return this.#loopBound();
	}
}
