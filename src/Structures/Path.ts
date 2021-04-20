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

import codes, {Codes} from './Utilities/status-codes';
import ErrorHandler from './error-handler';
import Core from './core';
import express from 'express';
import {join} from 'path';
import {Request} from './Interfaces/express-extended';
import {User} from './Database/db-class';
import uuid from 'uuid-random';

/**
 * @classdesc Base class for handling endpoints (execution, state, and other things)
 *
 * @author VoidNulll
 */
class Path {
	public label: string;

	public path: string[] | string;

	public type: string;

	public enabled?: boolean;

	public secureOnly?: boolean;

	public lean?: boolean;

	public reqAuth?: boolean;

	public codes: Codes;

	public readonly core: Core;

	public Utils: Core['Utils'];

	public locked: boolean;

	private readonly eHandler: ErrorHandler;

	private _fatalErrors: number;

	/**
     *
     * @param {Core} core The core of the project
     *
     * @prop {String} label The label for this path to be called
     * @prop {String} path The path that this path will fall under in the website/api
     * @prop {String} type=get The HTTP method this request will use
     * @prop {Boolean} enabled=true Whether or not to enable this endpoint.. Also helps handle errors
     * @prop {Boolean} lean=false Whether or not to ignore fatal (uncaught) errors in the long run
     *
     * @prop {Object} codes The http status codes Folderr uses
     * @prop {Object} Utils The Folderr utilities
     *
     * @prop {Object} eHandler The error handler for this path.
     * @prop {Number} _fatalErrors=0 Private. The amount of fatal errors this path has encountered.
     */
	constructor(core: Core) {
		this.label = 'label'; // Label for the path.
		this.path = ''; // The path to server for
		this.type = 'get'; // What type of request it needs
		this.enabled = true;
		this.lean = false;
		this.secureOnly = false;

		this.codes = codes;
		this.core = core;
		this.Utils = this.core.Utils;

		this.eHandler = new ErrorHandler(this);
		this._fatalErrors = 0;
		this.locked = false;
	}

	/**
     * Just toString the path, lol.
     * @returns {string}
     */
	toString(): string {
		return `[Path ${typeof this.path === 'string' ? this.path : this.path[0]}]`;
	}

	/**
     * @desc Actual endpoint execution
     * @async
     * @abstract
     *
     * @param {Object} request The request object
     * @param {Object} response Some object used for sending data back
     */
	async execute(request: any, response: any): Promise<express.Response | void> {
		throw new Error('Not implemented!');
	}

	async checkAuth(request: Request | express.Request): Promise<User | void> {
		if (request.headers.authorization && typeof request.headers.authorization === 'string') {
			return this.Utils.authorization.verifyAccount(request.headers.authorization);
		}

		if (request.cookies?.token && typeof request.cookies.token === 'string') {
			return this.Utils.authorization.verifyAccount(request.cookies.token, {web: true});
		}
	}

	async checkAuthAdmin(request: Request | express.Request): Promise<User | void> {
		if (request.headers.authorization && typeof request.headers.authorization === 'string') {
			return this.Utils.authorization.verifyAccount(request.headers.authorization, {fn: user => Boolean(user.admin)});
		}

		if (request.cookies?.token && typeof request.cookies.token === 'string') {
			return this.Utils.authorization.verifyAccount(request.cookies.token, {fn: user => Boolean(user.admin), web: true});
		}
	}

	generatePageQuery(request: Request, owner: string):
	{
		httpCode: number;
		json: Record<string, string|number>;
		errored: boolean;
	}
	|
	{
		query: {
			$gt?: {created: Date};
			$lt?: {created: Date};
			owner: string;
		};
		options: {
			sort?: Record<string, unknown>;
			limit?: number;
		};
		errored: boolean;
	} {
		const query: {
			$gt?: {created: Date};
			$lt?: {created: Date};
			owner: string;
		} = {owner};
		const options: {
			sort?: Record<string, unknown>;
			limit?: number;
		} = request.query?.gallery ? {sort: {created: -1}} : {};
		const limits = {
			max: 20,
			middle: 15,
			min: 10
		};
		let limit = request.query?.limit as string | number | undefined;
		if (typeof limit === 'string') {
			try {
				limit = Number(limit);
			} catch (error: unknown) {
				if (error instanceof Error) {
					if (process.env.DEBUG === 'true') {
						this.core.logger.log('debug', error.message);
					}

					return {httpCode: this.codes.notAccepted, json: {code: this.Utils.FoldCodes.unkownError, message: 'An unknown error has occured!'}, errored: true};
				}
			}
		}

		if (request.query?.gallery && limit && typeof limit === 'number') {
			if (limit >= limits.max) {
				options.limit = limits.max;
			} else if (limit >= limits.middle) {
				options.limit = limits.max;
			} else if (limit >= limits.min && limit < limits.middle) {
				options.limit = limits.min;
			} else if (limit <= limits.min) {
				options.limit = limits.min;
			} else {
				options.limit = limits.min;
			}
		} else {
			options.limit = 20;
		}

		if (request.query?.before) {
			if (request.query.before instanceof Date) {
				query.$lt = {created: request.query.before};
			} else if (typeof request.query.before === 'number') {
				query.$lt = {created: new Date(request.query.before)};
			}
		}

		if (request.query?.after) {
			if (request.query.after instanceof Date) {
				query.$gt = {created: request.query.after};
			} else if (typeof request.query.after === 'number') {
				query.$gt = {created: new Date(request.query.after)};
			}
		}

		return {query, options, errored: false};
	}

	/**
     * Handle rate limits, unhandled errors, execute actual endpoint
     *
     * @param {object} req The request object
     * @param {object} response Some object used for sending data back
     * @returns {express.Response|void}
     * @private
     */
	async _execute(request: any, response: express.Response): Promise<express.Response | void> {
		// If path is not enabled, and it is not lean... end the endpoint here
		if (this.locked && !this.lean) {
			if (!request.path.match('/api')) {
				response.status(this.codes.locked).sendFile(join(__dirname, '../Frontend/locked.html'));
				return;
			}

			return response.status(this.codes.locked).json({code: this.Utils.FoldCodes.locked, message: 'Endpoint locked!'});
		}

		if (this.secureOnly && !request.secure) {
			return response.status(this.codes.notAccepted).json({code: this.Utils.FoldCodes.securityError, message: 'Endpoint needs to be secure!'});
		}

		// Execute the endpoint and catch errors

		const id = uuid();
		this.core.addRequestID(id);
		try {
			const request_ = await this.execute(request, response);
			this.core.removeRequestID(id);
			return request_;
		} catch (error: unknown) {
			if (error instanceof Error) {
				return this._handleError(error, response, id);
			}
		}
	}

	/**
     * @desc Handle uncaught errors.
     *
     * @param {Object<Error>} err The error that occurred
     * @param {Object<express.Response>} response Express response that is with the error
     * @param {Object} [options]
     * @param {Boolean} [options.noIncrease] Whether or not to increase the fatal errors
     * @param {Boolean} [options.noResponse] Whether or not to send a response to the res.
     *
     * @returns {Object<express.Response>|Boolean}
     * @protected
    */
	protected _handleError(error: Error, response: express.Response, uuid?: string, options?: {noIncrease: boolean; noResponse: boolean}): express.Response|void {
		const ops = options ?? {noIncrease: false, noResponse: false};
		let severity;
		const error_ = error.message;
		if (!error_.startsWith('[ERROR]') && !ops.noIncrease) {
			if (this._fatalErrors > 2) {
				severity = 'fatal';
			} else {
				this._fatalErrors++;
				severity = '[fatal]';
			}
		}

		// Parse error and log the error
		const handled = this.eHandler.handlePathError(error, severity);
		const formattedMessage = `[PATH ${this.label}] ${handled.message}\n  Culprit: ${handled.culprit}\n  File: file://${handled.file.slice(1).replace(/\)$/, '')}\n  Severity: ${handled.severity ?? 'undefined'}`;
		this.core.logger.log('fatal', formattedMessage);
		const out = error.stack ? error.stack.replace(/\n/g, '<br>') : formattedMessage.replace(/\n/g, '<br>');
		if (ops.noResponse) {
			if (uuid) {
				this.core.removeRequestID(uuid);
			}

			return;
		}

		response.status(this.codes.internalErr).send(out);
		if (uuid) {
			this.core.removeRequestID(uuid);
		}

		throw new Error(error.message);
	}

	protected addFatalError(): void {
		this._fatalErrors++;
	}
}

export default Path;
