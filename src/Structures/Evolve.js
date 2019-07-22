import Base from './Base';
import * as paths from '../Paths/index';

class Evolve {
    constructor(options = {}) {
        this._options = options;
        this.paths = new Map();
        this.ips = new Map();
        this.ipBans = [];
    }

    async init () {
        const base = new Base(this, this._options);
        delete this._options;
        // Initiate paths
        for (let Path in paths) {
            console.log(`[INFO] Initializing Path ${Path}`);
            const mName = Path;
            Path = paths[Path];
            const path = new Path(this, base._options);
            // Handle if the path is a bad path
            if (!path.label || !path.path) {
                throw Error(`[ERROR] Path ${path.path || path.label} label and or path not found!`);
            }
            if (!path.execute) {
                throw Error(`[ERROR] Path ${path.label} does not have an execute method!`);
            }
            // Set the path, then initiate the path on the web server. I will probably set up a better method later
            this.paths.set(path.label, path);

            switch (path.type) {
                case 'put': {
                    base.web.put(path.path, (req, res) => {
                        return path._execute(req, res);
                    } );
                } case 'delete': {
                    base.web.delete(path.path, (req, res) => {
                        return path._execute(req, res);
                    } );
                } case 'patch': {
                    base.web.patch(path.path, (req, res) => {
                        return path._execute(req, res);
                    } );
                }
                default: {
                    base.web.get(path.path, (req, res) => {
                        return path._execute(req, res);
                    } );
                }
            }
            console.log(`[INFO] Initialized Path ${path.label} (${mName})!`);
        }
        // Initiate the base of the project
        await base.init();

        console.log('[INFO] Initialized!');
    }
}

export default Evolve;
