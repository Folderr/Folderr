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

/**
 * @author VoidNulll
 * @version 0.8.0
 */

import codes, { Codes } from './Utilities/Status_Codes';
import ErrorHandler from './ErrorHandler';
import Folderr from './Folderr';
import Base from './Base';
import express from 'express';
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

    public folderr: Folderr;

    public base: Base;

    public Utils: Base['Utils'];

    private eHandler: ErrorHandler;

    private _fatalErrors: number;

    public locked: boolean;

    /**
     *
     * @param {Object<Folderr>} folderr The Folderr client
     * @param {Object<Base>} base The base of the system
     *
     * @prop {String} label The label for this path to be called
     * @prop {String} path The path that this path will fall under in the website/api
     * @prop {String} type=get The HTTP method this request will use
     * @prop {Boolean} enabled=true Whether or not to enable this endpoint.. Also helps handle errors
     * @prop {Boolean} lean=false Whether or not to ignore fatal (uncaught) errors in the long run
     *
     * @prop {Object} codes The http status codes Folderr uses
     * @prop {Object} Folderr The Folderr-x client, at your disposal
     * @prop {Object} base The base of Folderr (where useful stuff like schemas are held) at your disposal.
     * @prop {Object} Utils The Folderr utilities
     *
     * @prop {Object} eHandler The error handler for this path.
     * @prop {Number} _fatalErrors=0 Private. The amount of fatal errors this path has encountered.
     */
    constructor(folderr: Folderr, base: Base) {
        this.label = 'label'; // Label for the path.
        this.path = ''; // The path to server for
        this.type = 'get'; // What type of request it needs
        this.enabled = true;
        this.lean = false;
        this.secureOnly = false;

        this.codes = codes;
        this.folderr = folderr;
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
     * @param {Object} [options]
     * @param {Boolean} [options.noIncrease] Whether or not to increase the fatal errors
     * @param {Boolean} [options.noResponse] Whether or not to send a response to the res.
     *
     * @returns {Object<express.Response>|Boolean}
     * @private
     */
    protected _handleError(err: Error, res: any, options?: { noIncrease: boolean; noResponse: boolean } ): express.Response|void {
        const ops = options || { noIncrease: false, noResponse: false };
        let severity;
        const e = err.message;
        if (!e.startsWith('[ERROR]') && !ops.noIncrease) {
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
        if (ops.noResponse) {
            return;
        }
        // eslint-disable-next-line consistent-return
        res.status(this.codes.internalErr).send(out);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        throw new Error(err);
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
            return res.status(this.codes.locked).json( { code: this.Utils.FoldCodes.locked, message: 'Endpoint locked!' } );
        }

        if (this.secureOnly && !req.secure) {
            return res.status(this.codes.notAccepted).json( { code: this.Utils.FoldCodes.security_error, message: 'Endpoint needs to be secure!' } );
        }

        // Execute the endpoint and catch errors

        try {
            return await this.execute(req, res);
        } catch (err) {
            return this._handleError(err, res);
        }
    }
}

export default Path;
