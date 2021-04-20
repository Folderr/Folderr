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
import Configurer, {DBConfig} from '../../handlers/config-handler';
import DB, {Upload} from '../Database/db-class';
import NativeDB from '../Database/mongoose-db';
import wlogger from '../winston-logger';

/**
 * @classdesc Handles deleting files
 */
export default class DBQueue extends EventEmitter {
	public onGoing: boolean;

	private readonly config: DBConfig;

	private readonly db: DB;

	private readonly _loopBound: () => Promise<void>;

	private readonly queue: Set<string>;

	constructor() {
		super();
		this.onGoing = true;
		this.config = Configurer.verifyFetch().db;
		this.db = new NativeDB();
		this.db.init(this.config.url).catch(error => {
			wlogger.error('CANNOT RUN DBQueue - Database Error');
			if (error instanceof Error && process.env.DEBUG) {
				wlogger.debug(error.message);
			}

			throw new Error('CANNOT RUN DBQueue - Database Error');
		});
		this._loopBound = this._loop.bind(this);
		this.on('start', this._loopBound);
		this.queue = new Set();
	}

	add(userID: string): boolean {
		this.queue.add(userID);
		if (!this.onGoing) {
			this.onGoing = true;
			this.emit('start');
			return true;
		}

		return true;
	}

	async removeFiles(files: Upload[]): Promise<void> {
		for (const file of files) {
			try { // Await is needed for this loops functioning
				// eslint-disable-next-line no-await-in-loop
				await this.db.purgeFile({ID: file.ID});
				files = files.filter(fil => fil.ID !== file.ID);
			} catch (error: unknown) {
				if (error instanceof Error) {
					wlogger.error(`Database ran into an error while deleting file "${file.path}". See below\n ${error.message}`);
				}

				wlogger.error(`Database ran into an error while deleting file "${file.path}".`);
			}
		}
	}

	private async _loop(): Promise<void> {
		if (this.queue.size === 0) {
			this.onGoing = false;
			this.emit('stopped');
			return;
		}

		// eslint-disable-next-line guard-for-in
		for (const value in this.queue.values()) { // Await is needed here, also eslint, yes this is checked
			/* eslint-disable no-await-in-loop */
			const files = await this.db.findFiles({owner: value}, {selector: 'ID, path'});
			if (files.length > 0) { /* eslint-enable no-await-in-loop */
				void this.removeFiles(files);
				this.queue.delete(value);
			}
		}

		return this._loopBound();
	}
}
