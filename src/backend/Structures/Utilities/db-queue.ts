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

import {EventEmitter} from 'events';
import type {DbConfig} from '../../handlers/config-handler';
import Configurer from '../../handlers/config-handler';
import type {Upload} from '../Database/db-class';
import type DB from '../Database/db-class';
import MongoDB from '../Database/mongoose-db';
import {logger} from '../../internals';

/**
 * @classdesc Handles deleting files
 */
export default class DbQueue extends EventEmitter {
	public onGoing: boolean;

	private readonly config: DbConfig;

	private readonly db: DB;

	private readonly loopBound: () => Promise<void>;

	private readonly queue: Set<string>;

	constructor() {
		super();
		this.onGoing = true;
		this.config = Configurer.verifyFetch().db;
		this.db = new MongoDB();
		this.db.init(this.config.url).catch((error) => {
			logger.error('CANNOT RUN DBQueue - Database Error');

			if (error instanceof Error) {
				logger.debug(error.message);
				throw error;
			}

			throw new Error('CANNOT RUN DBQueue - Database Error');
		});
		this.loopBound = this.loop.bind(this);
		this.on('start', this.loopBound);
		this.queue = new Set();
	}

	add(id: string): boolean {
		this.queue.add(id);
		if (!this.onGoing) {
			this.onGoing = true;
			this.emit('start');
			return true;
		}

		return true;
	}

	async removeFiles(files: Upload[]): Promise<void> {
		for (const file of files) {
			try {
				// Await is needed for this loops functioning
				// eslint-disable-next-line no-await-in-loop
				await this.db.purgeFile({id: file.id});
				files = files.filter((fil) => fil.id !== file.id);
			} catch (error: unknown) {
				if (error instanceof Error) {
					logger.error(
						// eslint-disable-next-line max-len
						`Database ran into an error while deleting file "${file.path}". See below\n ${error.message}`,
					);
				}

				logger.error(
					`Database ran into an error while deleting file "${file.path}".`,
				);
			}
		}
	}

	private async loop(): Promise<void> {
		if (this.queue.size === 0) {
			this.onGoing = false;
			this.emit('stopped');
			return;
		}

		for (const value of this.queue.values()) {
			// Await is needed here, also eslint, yes this is checked
			/* eslint-disable no-await-in-loop */
			const files = await this.db.findFiles(
				{owner: value},
				{selector: 'id, path'},
			);
			if (files.length > 0) {
				await this.removeFiles(files); /* eslint-enable no-await-in-loop */
				this.queue.delete(value);
			}
		}

		return this.loopBound();
	}
}
