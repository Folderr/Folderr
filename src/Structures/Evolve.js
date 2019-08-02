import Base from './Base';
import * as paths from '../Paths/index';

class Evolve {
    constructor(options = {} ) {
        this._options = options;
        this.paths = new Map();
        this.ips = new Map();
        this.ipBans = [];
    }

    _initPath(path, base) {
        // Handle if the path is a bad path
        if (!path.label || !path.path) {
            throw Error(`[ERROR] Path ${path.path || path.label} label and or path not found!`);
        }
        if (!path.execute) {
            throw Error(`[ERROR] Path ${path.label} does not have an execute method!`);
        }
        // Set the path, then initiate the path on the web server. I will probably set up a better method later
        this.paths.set(path.label, path);

        if (path.type === 'post') {
            base.web.post(path.path, (req, res) => path._execute(req, res) );
        } else if (path.type === 'delete') {
            base.web.delete(path.path, (req, res) => path._execute(req, res) );
        } else if (path.type === 'patch') {
            base.web.patch(path.path, (req, res) => path._execute(req, res) );
        } else {
            base.web.get(path.path, (req, res) => path._execute(req, res) );
        }
    }

    async init() {
        const base = new Base(this, this._options);
        delete this._options;
        // Initiate paths
        let pathNums = 0;
        for (let Path in paths) {
            const mName = Path;
            Path = paths[Path];
            const path = new Path(this, base);
            if (path.load) { // If the path should be loaded
                console.log(`[INFO] [INIT PATH] - Initializing Path ${path.label}`);
                // Init the path
                this._initPath(path, base);
                // Tell the user the path was initialized
                console.log(`[INFO] - [INIT PATH] - Initialized path ${path.label} (${mName}) with type ${path.type}!`);
                pathNums++;
            }
        }
        console.log(`[INFO] - [INIT] Initialized ${pathNums} paths`);
        // Initiate the base of the project
        await base.init();

        console.log('[INFO] Initialized!');
    }
}

export default Evolve;
