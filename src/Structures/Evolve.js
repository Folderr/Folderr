import Base from './Base';
import * as paths from '../Paths/index';

/**
 * @class Evolve
 *
 * @author Null#0515
 */
class Evolve {
    /**
     * @param {Object} options The options to pass to the base of the client
     *
     * @prop {Object} _options The options
     * @prop {Map} paths The Evolve-X paths
     * @prop {Map} ips The ips requesting evolve-x
     * @prop {String[]} ipBans The IPs temporarily banned
     */
    constructor(options = {} ) {
        this._options = options;
        this.paths = new Map();
        this.ips = new Map();
        this.ipBans = [];
    }

    /**
     * Initialize a path
     *
     * @param {Object} path The path to initialize
     * @param {Object} base The base of evolve-x
     * @private
     */
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

    /**
     * Initialize the base and evolve-x
     *
     * @returns {Promise<void>}
     */
    async init() {
        const base = new Base(this, this._options);
        delete this._options;
        // Initiate paths
        let pathNums = 0;
        for (let Path in paths) {
            const mName = Path;
            Path = paths[Path];
            const path = new Path(this, base);
            if (path.enabled) { // If the path should be loaded
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
