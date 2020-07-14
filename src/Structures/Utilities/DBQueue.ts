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

import { EventEmitter } from 'events';
import FolderrConfig, { ActualOptions } from '../Folderr-Config';
import config from '../../../config.json';
import DB, { Upload } from '../Database/DBClass';
import { pickDB } from '../Database/Pick';
import wlogger from '../WinstonLogger';

export default class DBQueue extends EventEmitter {
    private onGoing: boolean

    private config: ActualOptions;

    private db: DB;

    private _loopBound: () => Promise<void>;

    private queue: Set<string>

    constructor() {
        super();
        this.onGoing = true;
        this.config = new FolderrConfig(config);
        this.db = pickDB();
        this.db.init(this.config.mongoUrl, false).then(r => r).catch(e => {
            wlogger.error(`CANNOT RUN DBQueue - Database Error ${e}`);
            process.exit();
        } );
        this._loopBound = this._loop.bind(this);
        this.on('start', this._loopBound);
        this.queue = new Set();
    }

    add(userID: string) {
        this.queue.add(userID);
        if (!this.onGoing) {
            this.onGoing = true;
            this.emit('start');
            return true;
        }
        return true;
    }

    private async _loop() {
        if (this.queue.size === 0) {
            return;
        }
        for (const val in this.queue.values() ) {
            const files = await this.db.findFiles( { owner: val }, { selector: 'ID, path' } );
            if (files.length > 0) {
                await this.removeFiles(files);
                this.queue.delete(val);
            }
        }
        return this._loopBound();
    }

    async removeFiles(files: Upload[] ) {
        for (const file of files) {
            try {
                await this.db.purgeFile( { ID: file.ID } );
                files = files.filter(fil => fil.ID !== file.ID);
            } catch (e) {
                wlogger.error(`Database ran into an error while deleting file "${file.path}". See below\n ${e.message || e}`);
            }
        }
    }
}
