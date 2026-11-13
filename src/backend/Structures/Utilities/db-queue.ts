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

import { EventEmitter } from "node:events";
import { unlink } from "node:fs/promises";
import { setImmediate as yieldToRequests } from "node:timers/promises";
import * as Sentry from "@sentry/node";
import type DB from "../Database/db-class.js";
import logger from "../logger.js";
import { uploadPath } from "./upload-types.js";

// Upload records read from the database at a time
const PAGE_SIZE = 500;
// Files unlinked at once. Node's file thread pool (4 threads by default) is shared with
// serving uploads and argon2, so a big account must not fill it
const UNLINK_BATCH = 8;

/**
 * @classdesc Deletes users and everything they own, one user at a time, without starving requests.
 * Runs in the server's process, so it waits between batches to let requests through.
 *
 * Emits "stopped" whenever the queue empties or stops.
 */
export default class DbQueue extends EventEmitter {
	public onGoing: boolean;

	readonly #db: DB;

	readonly #queue: Set<string>;

	#stopping: boolean;

	constructor(db: DB) {
		super();
		this.onGoing = false;
		this.#db = db;
		this.#queue = new Set();
		this.#stopping = false;
	}

	/**
	 * @desc Queues a user for deletion. Their files go first; the account only goes once
	 * every file is gone from disk, so a failed deletion can be retried.
	 * @returns false once the queue is shutting down
	 */
	add(id: string): boolean {
		if (this.#stopping) {
			return false;
		}

		this.#queue.add(id);
		if (!this.onGoing) {
			void this.#run();
		}

		return true;
	}

	/**
	 * @desc Finishes the current batch and stops. Users not finished keep their account
	 * and remaining files, and need queueing again.
	 */
	async stop(): Promise<void> {
		this.#stopping = true;
		if (!this.onGoing) {
			return;
		}

		await new Promise((resolve) => {
			this.once("stopped", resolve);
		});
	}

	async #run(): Promise<void> {
		this.onGoing = true;
		while (this.#queue.size > 0 && !this.#stopping) {
			const [id] = this.#queue;
			try {
				await this.#deleteUser(id);
			} catch (error: unknown) {
				// One user failing must never take the server down or stall the queue
				logger.error(
					`Account Deleter: Could not finish deleting ${id}`,
				);
				logger.error(error);
				Sentry.captureException(error);
			}

			this.#queue.delete(id);
		}

		this.onGoing = false;
		this.emit("stopped");
	}

	async #deleteUser(id: string): Promise<void> {
		while (!this.#stopping) {
			const files = await this.#db.listFiles(id, { limit: PAGE_SIZE });
			if (files.length === 0) {
				// Every file is gone from disk, so the account can go
				await this.#db.purgeUser(id);
				await this.#db.purgeTokens(id);
				return;
			}

			const removed: string[] = [];
			let failed = 0;
			for (let i = 0; i < files.length; i += UNLINK_BATCH) {
				const batch = files.slice(i, i + UNLINK_BATCH);
				const results = await Promise.allSettled(
					batch.map(async (file) => {
						try {
							await unlink(uploadPath(file.id, file.ext));
						} catch (error: unknown) {
							// Already gone from disk is as good as deleted
							if (
								(error as NodeJS.ErrnoException).code !==
								"ENOENT"
							) {
								throw error;
							}
						}

						return file.id;
					}),
				);
				for (const result of results) {
					if (result.status === "fulfilled") {
						removed.push(result.value);
					} else {
						failed++;
						logger.error(result.reason);
					}
				}

				await yieldToRequests();
			}

			await this.#db.purgeFilesByIds(id, removed);
			// Those records and the account stay, so stop instead of reading the same files forever
			if (failed > 0) {
				throw new Error(
					`${failed} of ${id}'s files could not be removed from disk`,
				);
			}
		}
	}
}
