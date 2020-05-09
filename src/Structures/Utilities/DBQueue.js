import { EventEmitter } from 'events';
import FolderrConfig from '../Folderr-Config';
import config from '../../../config.json';
import { pickDB } from '../Database/Pick';
export default class DBQueue extends EventEmitter {
    constructor() {
        super();
        this.onGoing = true;
        this.config = new FolderrConfig(config);
        this.db = pickDB();
        this.db.init(this.config.mongoUrl, false).then(r => r).catch(e => {
            console.log(`CANNOT RUN DBQueue - Database Error ${e}`);
            process.exit();
        });
        this._loopBound = this._loop.bind(this);
        this.on('start', this._loopBound);
        this.queue = new Set();
    }
    add(userID) {
        this.queue.add(userID);
        if (!this.onGoing) {
            this.onGoing = true;
            this.emit('start');
            return true;
        }
        return true;
    }
    async _loop() {
        if (this.queue.size === 0) {
            return;
        }
        for (const val in this.queue.values()) {
            const files = await this.db.findFiles({ owner: val }, { selector: 'ID, path' });
            if (files.length > 0) {
                await this.removeFiles(files);
                this.queue.delete(val);
            }
        }
        return this._loopBound();
    }
    async removeFiles(files) {
        for (const file of files) {
            try {
                await this.db.purgeFile({ ID: file.ID });
                files = files.filter(fil => fil.ID !== file.ID);
            }
            catch (e) {
                console.log(`Database ran into an error while deleting file "${file.path}". See below\n ${e.message || e}`);
            }
        }
    }
}
