/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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
 * @version 0.8.0
 */

import codes, { Codes } from './Status_Codes';
import ErrorHandler from './ErrorHandler';
import Evolve from './Evolve';
import Base from './Base';
import express from 'express';
import * as cluster from 'cluster';
import { join } from 'path';

/**
 * Path structure
 *
 * @class Path
 *\
 * @classdesc Base class for handling endpoints (security, execution, and state)
 *
 * @author VoidNulll
 */
class Path {
    public label: string;

    public path: string[] | string;

    public type?: string;

    public enabled?: boolean;

    public secureOnly?: boolean;

    public lean?: boolean;

    public reqAuth?: boolean;

    public codes: Codes;

    public evolve: Evolve;

    public base: Base;

    public Utils: Base['Utils'];

    private eHandler: ErrorHandler;

    private _fatalErrors: number;

    public locked: boolean;

    /**
     *
     * @param {Object<Evolve>} evolve The Evolve-X client
     * @param {Object<Base>} base The base of the system
     *
     * @prop {String} label The label for this path to be called
     * @prop {String} path The path that this path will fall under in the website/api
     * @prop {String} type=get The HTTP method this request will use
     * @prop {Boolean} enabled=true Whether or not to enable this endpoint.. Also helps handle errors
     * @prop {Boolean} lean=false Whether or not to ignore fatal (uncaught) errors in the long run
     *
     * @prop {Object} codes The http status codes Evolve-X uses
     * @prop {Object} evolve The evolve-x client, at your disposal
     * @prop {Object} base The base of evolve-x (where useful stuff like schemas are held) at your disposal.
     * @prop {Object} Utils The evolve-x utilities
     *
     * @prop {Object} eHandler The error handler for this path.
     * @prop {Number} _fatalErrors=0 Private. The amount of fatal errors this path has encountered.
     */
    constructor(evolve: Evolve, base: Base) {
        this.label = 'label'; // Label for the path.
        this.path = ''; // The path to server for
        this.type = 'get'; // What type of request it needs
        this.enabled = true;
        this.lean = false;
        this.secureOnly = false;

        this.codes = codes;
        this.evolve = evolve;
        this.base = base;
        this.Utils = this.base.Utils;

        this.eHandler = new ErrorHandler(this);
        this._fatalErrors = 0;
        this.locked = false;
    }

    /**
     * Just toString the path, lol.
     * @returns {string}
     */
    toString(): string {
        return `[Path ${this.path}]`;
    }

    /* eslint-disable */
    /**
     * @desc Actual endpoint execution
     * @async
     * @abstract
     *
     * @param {Object} req The request object
     * @param {Object} res Some object used for sending data back
     */
    execute(req: any, res: any): Promise<express.Response | void> {
        throw Error('Not implemented!');
    }
    /* eslint-enable */

    /**
     * @desc Handle uncaught errors.
     *
     * @param {Object<Error>} err The error that occurred
     * @param {Object<express.Response>} res Express response that is with the error
     *
     * @returns {Object<express.Response>}
     * @private
     */
    _handleError(err: Error, res: any): express.Response {
        let severity;
        const e = err.message;
        if (!e.startsWith('[ERROR]') ) {
            if (this._fatalErrors > 2) {
                severity = 'fatal';
            } else {
                this._fatalErrors++;
                severity = '[fatal]';
            }
        }
        // Parse error and log the error
        const handled = this.eHandler.handlePathError(err, severity);
        const formattedMessage = `[INTERNAL ERROR] [PATH ${this.label}] ${handled.message}\n  Culprit: ${handled.culprit}\n  File: file://${handled.file.slice(1).replace(/\)$/, '')}\n  Severity: ${handled.severity}`;
        console.log(formattedMessage);
        const out = err.stack ? err.stack.replace(/\n/g, '<br>') : formattedMessage.replace(/\n/g, '<br>');
        return res.status(this.codes.internalErr).send(out);
    }

    /**
     * Handle rate limits, unhandled errors, execute actual endpoint
     *
     * @param {object} req The request object
     * @param {object} res Some object used for sending data back
     * @returns {express.Response|void}
     * @private
     */
    async _execute(req: any, res: any): Promise<express.Response | void> {
        // If path is not enabled, and it is not lean... end the endpoint here
        if (this.locked && !this.lean) {
            if (!req.path.match('/api') ) {
                return res.status(this.codes.locked).sendFile(join(__dirname, '../Frontend/locked.html') );
            }
            return res.status(this.codes.locked).send('[FATAL] Endpoint locked!');
        }

        if (this.secureOnly && !req.secure) {
            return res.status(this.codes.notAccepted).send('[FATAL] Endpoint needs to be secure!');
        }
        // Define number variables for ratelimiting
        const banned = this.evolve.ratelimiter.isBanned(req.ip);
        if (banned) {
            const banType = this.evolve.ratelimiter.getBanCount(req.ip);
            if (!req.path.match('/api') ) {
                return res.status(this.codes.tooManyReq).sendFile(join(__dirname, `../Frontend/banned_${typeof banType !== 'boolean' && banType - 1 > 0 ? String(banType) : '1'}.html`) );
            }
            const types = {
                1: '5 minutes',
                2: '30 minutes',
                3: '1 hour',
            };
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            return res.status(this.codes.tooManyReq).send(`Rate limited (Banned) for ${typeof banType !== 'boolean' ? types[banType] : types['1']}`);
        }
        // If ratelimited, tell the user

        this.addIP(req.ip);
        const reqs = this.evolve.ratelimiter.getReq(req.ip);
        if (reqs && typeof reqs !== 'boolean' && reqs >= this.evolve.ratelimiter.rules.max) {
            this.addIPBan(req.ip);
            await this.Utils.sleep(1000);
        }
        const nbanned = this.evolve.ratelimiter.isBanned(req.ip);
        if (nbanned) {
            const banType = this.evolve.ratelimiter.getBanCount(req.ip);
            const times = {
                1: 'firstTime',
                2: 'secondTime',
                3: 'maxTime',
            };
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const time = this.evolve.ratelimiter.rules[times[banType]];
            const types = {
                1: '5 minutes',
                2: '30 minutes',
                3: '1 hour',
            };
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            console.log(`[RATELIMITER] Banned ${req.ip} until ${new Date(Date.now() + time).toTimeString()} (${typeof banType !== 'boolean' ? types[banType] : types['1']})\n[SYSTEM TIME] It is ${new Date().toTimeString()}`);
            if (!req.path.match('/api') ) {
                return res.status(this.codes.tooManyReq).sendFile(join(__dirname, `../Frontend/banned_${typeof banType !== 'boolean' ? String(banType) : '1'}.html`) );
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            return res.status(this.codes.tooManyReq).send(`Rate limited (Banned) for ${typeof banType !== 'boolean' ? types[banType] : types['1']}`);
        }

        // Execute the endpoint and catch errors

        try {
            return await this.execute(req, res);
        } catch (err) {
            return this._handleError(err, res);
        }
    }

    addIPBan(ip: string): void {
        if (cluster.isWorker) {
            this.base.sendToMaster( { messageType: 'banAdd', value: ip, sendToAll: true } );
        } else {
            this.evolve.addIPBan(ip);
        }
    }

    addIP(ip: string): void {
        if (cluster.isWorker) {
            this.base.sendToMaster( { messageType: 'ipAdd', value: ip, sendToAll: true } );
        } else {
            this.evolve.addIP(ip);
        }
    }

    removeIP(ip: string): void {
        if (cluster.isWorker) {
            this.base.sendToMaster( { messageType: 'ipRemove', value: ip, sendToAll: true } );
        } else {
            this.evolve.removeIP(ip);
        }
    }

    removeIPBan(ip: string): void {
        if (cluster.isWorker) {
            this.base.sendToMaster( { messageType: 'banRemove', value: ip, sendToAll: true } );
        } else {
            this.evolve.removeIPBan(ip);
        }
    }
}

export default Path;
