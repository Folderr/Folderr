import Base from './Base';
import { Options } from './Evolve-Config';
import * as paths from '../Paths';
import Path from './Path';
import { join } from 'path';
import { Request } from 'express';

const notFound = 404;


/**
 * @class Evolve
 *
 * @author Null#0515
 */
class Evolve {
    private _options: Options;

    public paths: Map<string, object>;

    public ips: Map<string, number>;

    public ipBans: string[];

    private clearingTokens: boolean;

    /**
     * @param {Object} options The options to pass to the base of the client
     *
     * @prop {Object} _options The options
     * @prop {Map} paths The Evolve-X paths
     * @prop {Map} ips The ips requesting evolve-x
     * @prop {String[]} ipBans The IPs temporarily banned
     */
    constructor(options: Options) {
        this._options = options;
        this.paths = new Map();
        this.ips = new Map();
        this.ipBans = [];
        this.clearingTokens = false;
    }

    /**
     * Initialize a path
     *
     * @param {Object<Path>} path The path to initialize
     * @param {Object} base The base of evolve-x
     * @private
     */
    _initPath(path: Path, base: Base): void {
        // Handle if the path is a bad path
        if (!path.label || !path.path) {
            throw Error(`[ERROR] Path ${path.path || path.label} label and or path not found!`);
        }
        if (!path.execute) {
            throw Error(`[ERROR] Path ${path.label} does not have an execute method!`);
        }
        // Set the path, then initiate the path on the web server. I will probably set up a better method later
        this.paths.set(path.label, path);

        // Init the path with the web app
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
    async init(): Promise<void> {
        // Init the base, remove options
        const base = new Base(this, this._options);
        delete this._options;
        // eslint-disable-next-line consistent-return
        base.web.get(['/admin', '/admin/*'], async(req, res, next) => {
            if (!req.cookies || !req.cookies.token) {
                console.log(`[SECURITY WARN] Admin request failed. Request originated from ${req.ips ? req.ips[0] : req.ip}!`);
                return res.redirect('/');
            }
            if (req.cookies && req.cookies.token) {
                const auth = await base.Utils.authBearerToken(req.cookies);
                if (!auth || typeof auth === 'string') {
                    console.log(`[SECURITY WARN] Admin request failed. Request originated from ${req.ips ? req.ips[0] : req.ip}!`);
                    return res.redirect('/');
                }
                if (auth && !auth.admin) {
                    console.log(`[SECURITY WARN] Admin request failed. Request originated from ${req.ips ? req.ips[0] : req.ip}!`);
                    res.clearCookie('token');
                    return res.redirect('/');
                }
            }
            next();
        } );
        // Initiate paths
        let pathNums = 0;
        for (const path in paths) {
            const mName: string = path;
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const Ok = paths[path];
            const apath: Path = new Ok(this, base);
            if (apath.enabled) { // If the path should be loaded
                console.log(`[SYSTEM INIT PATH] - Initializing Path ${apath.label}`);
                // Init the path
                this._initPath(apath, base);
                // Tell the user the path was initialized and add the number of paths loaded by 1
                console.log(`[SYSTEM INIT PATH] - Initialized path ${apath.label} (${mName}) with type ${apath.type}!`);
                pathNums++;
            }
        }
        console.log(`[SYSTEM INIT] Initialized ${pathNums} paths`);
        // Initiate the base of the project
        await base.init();
        base.web.all('/*', (req: Request, res) => {
            console.log(`[INFO] ${req.path} not found with method: ${req.method}. Originated from ${req.ips ? req.ips[0] : req.ip}!`);
            res.status(notFound).sendFile(join(__dirname, '../Frontend/HTML/Not_Found.html') );
        } );

        const mins = 120000;
        setTimeout(async() => {
            if (this.clearingTokens) {
                return;
            }
            await this.removeTokens(base);
        }, mins);

        console.log('[SYSTEM INFO] Initialized!');
        if (process.env.NODE_ENV === 'test') {
            process.exit();
        }
    }

    async removeTokens(base: Base): Promise<void> {
        this.clearingTokens = true;
        const tokens = await base.schemas.BearerTokens.find();
        if (!tokens || tokens.length === 0) {
            return;
        }
        const atokens = tokens.filter(token => new Date() > token.expires);
        if (!atokens || atokens.length === 0) {
            return;
        }
        for (const token of atokens) {
            await base.schemas.BearerTokens.findOneAndRemove( { _id: token._id } );
        }
    }
}

export default Evolve;
