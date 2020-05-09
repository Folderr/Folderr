/**
 * @license
 *
 * Folderr is an open source image host. https://gitlab.com/evolve-x
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

/**
 * @author VoidNulll
 * Contact me at https://gitlab.com/VoidNulll
 * @version 0.8.0
 */

/* eslint require-atomic-updates: "off" */

import Base from './Base';
import { Options } from './Folderr-Config';
import * as paths from '../Paths';
import Path from './Path';
import { join } from 'path';
import { Request, Response } from 'express';
import { isMaster } from 'cluster';
import codes from './Utilities/Status_Codes';
import { User } from './Database/DBClass';

/**
 * @class Evolve
 *
 * @classdesc Base client for Folderr-X, handles banning IPs in memory and security for the frontend
 *
 * @author Null#0515
 */
class Folderr {
    private _options: Options;

    public paths: Map<string, object>;

    public base: Base;

    /**
     * @param {Object} options The options to pass to the base of the client
     *
     * @prop {Object} _options The options
     * @prop {Map} paths The Folderr-X paths
     * @prop {Map} ips The ips requesting evolve-x
     * @prop {String[]} ipBans The IPs temporarily banned
     */
    constructor(options: Options, flags?: string) {
        this._options = options;
        this.paths = new Map();
        this.handleAdminAuth = this.handleAdminAuth.bind(this);
        this.handleHeaders = this.handleHeaders.bind(this);
        this.base = new Base(this, this._options, flags);
        this.checkFAuth = this.checkFAuth.bind(this);
    }



    /**
     * @desc Initialize a path
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
     * @desc Check if there is a user session under a week lasting bearer token
     * @async
     *
     * @param req ExpressJS Request
     * @param res ExpressJS Response
     *
     * @returns {Promise<UserI|boolean|undefined>}
     */
    async checkFrontendAuth(req: any, res: any): Promise<User | false | undefined> {
        if (req.cookies && req.cookies.token) {
            const auth = this.base && await this.base.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
            if (!auth && req.cookies.token) {
                res.clearCookie('token');
            }
            req.uauth = auth;
        }
        return false;
    }

    /**
     * @desc Actual frontend authorization handler
     *
     * @async
     *
     * @param req ExpressJS request
     * @param res ExpressJS response
     * @param next {function} ExpressJS middleware next function
     *
     * @returns {Promise<*>}
     */
    async checkFAuth(req: any, res: any, next: any): Promise<any> {
        const fa1 = await this.checkFrontendAuth(req, res);
        if (fa1) {
            req.uauth = fa1;
            return next();
        }
        return next();
    }

    /**
     * @desc Handles setting security headers for the request for the app to respond with
     * @param req ExpressJS Request
     * @param res ExpressJS Response
     * @param next {function} ExpressJS middleware next function
     * @returns {void}
     */
    handleHeaders(req: Request, res: Response, next: any): void {
        if (!this.base || !this.base.options.certOptions || !this.base.options.certOptions.cert || !this.base.options.certOptions.key) {
            res.set( {
                'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\' cdnjs.cloudflare.com polyfill.io unpkg.com; style-src \'self\' \'unsafe-inline\' fonts.googleapis.com cdnjs.cloudflare.com; img-src \'self\' https://*; frame-src \'none\'; font-src \'self\' fonts.gstatic.com cdnjs.cloudflare.com',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'no-referrer, origin-when-cross-origin',
                'X-XSS-Protection': '1; mode=block',
                'X-Content-Type-Options': 'nosniff',
                'Access-Control-Allow-Origin': '*',
            } );
        } else {
            res.set( {
                'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\' cdnjs.cloudflare.com polyfill.io unpkg.com; style-src \'self\' \'unsafe-inline\' fonts.googleapis.com cdnjs.cloudflare.com; img-src \'self\' https://*; frame-src \'none\'; font-src \'self\' fonts.gstatic.com cdnjs.cloudflare.com',
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

    /**
     * @desc Handles setting security headers for the request for the app to respond with
     * @async
     * @param req ExpressJS Request
     * @param res ExpressJS Response
     * @param next {function} ExpressJS middleware next function
     * @returns {Promise<*>}
     */
    // eslint-disable-next-line consistent-return
    async handleAdminAuth(req: Request, res: Response, next: any): Promise<any> {
        if (!this.base) {
            return res.redirect('/');
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        if (!req.uauth || !req.uauth.admin || typeof req.auth === 'string') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            await this.base.Logger.log('SECURITY WARN', `Admin authorization request Failed. From ip ${req.ips.length !== 0 ? req.ips[0] : req.ip}`, { user: req.uauth && `${req.uauth.username} (${req.uauth.uID})` }, 'securityWarn', 'SECURITY - Admin authorization failed');
            return res.redirect('/');
        }
        next();
    }

    /**
     * @desc Initialize the base and evolve-x
     *
     * @returns {Promise<void>}
     */
    // eslint-disable-next-line consistent-return
    async init(): Promise<void> {
        if (!this.base.sharderReady) {
            const sec = 2000;
            await this.base.Utils.sleep(sec);
            return this.init();
        }
        // Init the base, remove options
        const { base } = this;
        delete this._options;
        base.web.use('*', this.handleHeaders);
        // Initiate paths
        let pathNums = 0;
        for (const path in paths) {
            const mName: string = path;
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const Ok = paths[path];
            const apath: Path = new Ok(this, base);
            if (apath.enabled) { // If the path should be loaded
                if (this.base.useSharder) {
                    // Init the path
                    this._initPath(apath, base);
                    pathNums++;
                } else {
                    console.log(`[SYSTEM INIT PATH] - Initializing Path ${apath.label}`);
                    this._initPath(apath, base);
                    // Init the path
                    // Tell the user the path was initialized and add the number of paths loaded by 1
                    console.log(`[SYSTEM INIT PATH] - Initialized path ${apath.label} (${mName}) with type ${apath.type}!`);
                    pathNums++;
                }
            }
        }
        if (!this.base.useSharder) {
            console.log(`[SYSTEM INIT] Initialized ${pathNums} paths`);
        }
        // Initiate the base of the project
        await base.init();
        base.web.all('/*', async(req: Request, res) => {
            console.log(`[INFO] ${req.path} not found with method: ${req.method}. Originated from ${req.ips ? req.ips[0] : req.ip}!`);
            const dir = join(__dirname, '../Frontend/notfound.html');
            if (req.cookies && req.cookies.token) {
                const auth = await base.Utils.authorization.verifyAccount(req.cookies.token, { web: true } );
                if (!auth || typeof auth === 'string') {
                    res.clearCookie('token');
                    return res.sendFile(dir);
                }
                return res.status(codes.notFound).sendFile(join(__dirname, '../Frontend/notfound_loggedIn.html') );
            }
            return res.status(codes.notFound).sendFile(dir);
        } );

        if ( (this.base.useSharder && isMaster) || !this.base.useSharder) {
            await this.base.Logger.log('SYSTEM INFO', `Folderr has been initialized!`, {}, 'online', 'Folderr V2 is online');
        }
        if (process.env.NODE_ENV === 'test') {
            process.exit();
        }
    }
}

export default Folderr;
