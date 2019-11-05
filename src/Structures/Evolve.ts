import Base from './Base';
import { Options } from './Evolve-Config';
import * as paths from '../Paths';
import Path from './Path';
import { join } from 'path';
import { Request, Response } from 'express';
import EvolveSession from './EvolveSession';
import { UserI } from '../Schemas/User';

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

    public Session: EvolveSession;

    private clearingTokens: boolean;

    private base: Base;

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
        this.handleAdminAuth = this.handleAdminAuth.bind(this);
        this.handleHeaders = this.handleHeaders.bind(this);
        this.Session = new EvolveSession();
        this.base = new Base(this, this._options);
        this.checkFAuth = this.checkFAuth.bind(this);
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

    checkFrontendSessionAuth(req: any, res: any): any {
        this.Session.removeIfNeeded(req, res);
        return this.Session.fetchSession(req);
    }

    async checkFrontendAuth(req: any, res: any): Promise<UserI | false | undefined> {
        if (req.cookies && req.cookies.token) {
            const auth = this.base && await this.base.Utils.authBearerToken(req.cookies);
            if (typeof auth === 'string' || !auth) {
                if (req.cookies.token && !auth) {
                    res.clearCookie('token', { secure: false, sameSite: 'Strict', path: '/' } );
                }
                return false;
            }
            return auth;
        }
    }

    async checkFAuth(req: any, res: any, next: any) {
        const fa1 = await this.checkFrontendAuth(req, res);
        if (fa1) {
            req.uauth = fa1;
            return next();
        }
        const fa2 = this.checkFrontendSessionAuth(req, res);
        if (fa2) {
            req.uauth = fa2;
            return next();
        }
        return next();
    }

    handleHeaders(req: Request, res: Response, next: any): any {
        if (!this.base || !this.base.options.certOptions || !this.base.options.certOptions.cert || !this.base.options.certOptions.key) {
            res.set( {
                'Content-Security-Policy': 'frame-ancestors \'none\'',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'no-referrer, origin-when-cross-origin',
                'X-XSS-Protection': '1; mode=block',
                'X-Content-Type-Options': 'nosniff',
                'Access-Control-Allow-Origin': '*',
            } );
        } else {
            res.set( {
                'Content-Security-Policy': 'frame-ancestors \'none\'',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'no-referrer, origin-when-cross-origin',
                'X-XSS-Protection': '1; mode=block',
                'X-Content-Type-Options': 'nosniff',
                'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
                'Access-Control-Allow-Origin': '*',
            } );
        }
        next();
    }

    // eslint-disable-next-line consistent-return
    async handleAdminAuth(req: Request, res: Response, next: any): Promise<any> {
        if (!this.base) {
            return res.redirect('/');
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        if (!req.uauth || !req.uauth.admin || typeof req.auth === 'string') {
            console.log(`[SECURITY WARN] Admin request failed. Request originated from ${req.ips.length !== 0 ? req.ips[0] : req.ip}!`);
            this.base.Logger.log('SECURITY WARN', `Admin authorization request Failed. From ip ${req.ips.length !== 0 ? req.ips[0] : req.ip}`,{}, 'securityWarn', 'SECURITY - Admin authorization failed');
            return res.redirect('/');
        }
        next();
    }

    /**
     * Initialize the base and evolve-x
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        // Init the base, remove options
        const { base } = this;
        delete this._options;
        base.web.use('*', this.handleHeaders);
        // eslint-disable-next-line no-return-await
        const authablePages = [
            '/',
            '/upload',
            '/account',
            '/privacy',
            '/manage',
            '/admin',
            '/admin/notifications',
            '/admin/users',
            '/admin/verify',
        ];
        base.web.use(authablePages, this.checkFAuth);
        base.web.use( ['/admin', '/admin/*'], this.handleAdminAuth);
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
        base.web.all('/*', async(req: Request, res) => {
            console.log(`[INFO] ${req.path} not found with method: ${req.method}. Originated from ${req.ips ? req.ips[0] : req.ip}!`);
            const dir = join(__dirname, '../Frontend/notfound.html');
            if (req.cookies && req.cookies.token) {
                const auth = await base.Utils.authBearerToken(req.cookies);
                if (!auth || typeof auth === 'string') {
                    res.clearCookie('token');
                    return res.sendFile(dir);
                }
                return res.sendFile(join(__dirname, '../Frontend/notfound_loggedIn.html') );
            }
            return res.sendFile(dir);
        } );

        const mins = 120000;
        setTimeout(async() => {
            if (this.clearingTokens) {
                return;
            }
            await this.removeTokens(base);
        }, mins);

        this.base.Logger.log('SYSTEM INFO', 'Evolve-X has been initialized!', {}, 'online', 'Evolve-X is online');
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
