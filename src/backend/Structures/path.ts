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

import {join} from 'path';
import {FastifyRequest, FastifyReply, RouteShorthandOptions} from 'fastify';
import {RequestGallery} from '../../types/fastify-request-types';
import {ErrorHandler, Core, codes, Codes} from '../internals';
import {User} from './Database/db-class';

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

	public options?: RouteShorthandOptions;

	private readonly eHandler: ErrorHandler;

	private fatalErrors: number;

	/**
	 *
	 * @param {Core} core The core of the project
	 *
	 * @prop {String} label The label for this path to be called
	 * @prop {String} path The path that this path will fall under in the website/api
	 * @prop {String} type=get The HTTP method this request will use
	 * @prop {Boolean} enabled=true Whether or not to enable this endpoint..
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
		this.fatalErrors = 0;
		this.locked = false;
		this.options = this.getOptions();
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
	async execute(
		/* eslint-disable @typescript-eslint/no-unused-vars */
		request: FastifyRequest,
		response: FastifyReply /* eslint-enable @typescript-eslint/no-unused-vars */
	): Promise<FastifyReply | void> {
		throw new Error('Not implemented!');
	}

	async checkAuth(request: FastifyRequest): Promise<User | void> {
		if (
			request.headers.authorization &&
			typeof request.headers.authorization === 'string'
		) {
			return this.Utils.authorization.verifyAccount(
				request.headers.authorization
			);
		}

		if (request.cookies.token && typeof request.cookies.token === 'string') {
			return this.Utils.authorization.verifyAccount(request.cookies.token, {
				web: true
			});
		}
	}

	async checkAuthAdmin(request: FastifyRequest): Promise<User | void> {
		if (
			request.headers.authorization &&
			typeof request.headers.authorization === 'string'
		) {
			return this.Utils.authorization.verifyAccount(
				request.headers.authorization,
				{
					fn: (user) => Boolean(user.admin)
				}
			);
		}

		if (request.cookies.token && typeof request.cookies.token === 'string') {
			return this.Utils.authorization.verifyAccount(request.cookies.token, {
				web: true,
				fn: (user) => Boolean(user.admin)
			});
		}
	}

	generatePageQuery(
		request: FastifyRequest<{
			Querystring?: RequestGallery;
		}>,
		owner: string
	):
		| {
				httpCode: 406;
				json: Record<string, string | number>;
				errored: boolean;
		  }
		| {
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
		let limit = request.query?.limit;
		if (typeof limit === 'string') {
			try {
				limit = Number(limit);
			} catch (error: unknown) {
				if (error instanceof Error) {
					if (process.env.DEBUG === 'true') {
						this.core.logger.log('debug', error.message);
					}

					return {
						httpCode: this.codes.notAccepted,
						json: {
							code: this.Utils.FoldCodes.unkownError,
							message: 'An unknown error has occured!'
						},
						errored: true
					};
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

	async preHandler(
		request: FastifyRequest,
		response: FastifyReply,
		done: () => void
	): Promise<FastifyReply | void> {
		// If path is not enabled, and it is not lean... end the endpoint here
		if (this.locked && !this.lean) {
			if (!request.url.includes('/api')) {
				return response
					.status(this.codes.locked)
					.sendFile(join(process.cwd(), '/Frontend/locked.html'));
			}

			return response.status(this.codes.locked).send({
				code: this.Utils.FoldCodes.locked,
				message: 'Endpoint locked!'
			});
		}

		if (this.secureOnly && request.protocol !== 'https') {
			return response.status(this.codes.notAccepted).send({
				code: this.Utils.FoldCodes.securityError,
				message: 'Endpoint needs to be secure!'
			});
		}

		done();
	}

	getOptions(): RouteShorthandOptions {
		const options = this.options ?? {};
		options.preHandler = this.preHandler;
		return options;
	}

	/**
	 * @desc Handle uncaught errors.
	 *
	 * @param {Object<Error>} err The error that occurred
	 * @param {FastifyReply} response Express response that is with the error
	 * @param {Object} [options]
	 * @param {Boolean} [options.noIncrease] Whether or not to increase the fatal errors
	 * @param {Boolean} [options.noResponse] Whether or not to send a response to the res.
	 *
	 * @returns {FastifyReply|Boolean}
	 * @protected
	 */
	protected handleError(
		error: Error,
		response: FastifyReply,
		uuid?: string,
		options?: {
			noIncrease: boolean;
			noResponse: boolean;
		}
	): FastifyReply | void {
		const ops = options ?? {noIncrease: false, noResponse: false};
		let severity;
		const error_formatted = error.message;
		if (!error_formatted.startsWith('[ERROR]') && !ops.noIncrease) {
			if (this.fatalErrors > 2) {
				severity = 'fatal';
			} else {
				this.fatalErrors++;
				severity = '[fatal]';
			}
		}

		// Parse error and log the error
		const handled = this.eHandler.handlePathError(error, severity);
		const formattedMessage = `[PATH ${this.label}] ${
			handled.message
		}\n  Culprit: ${handled.culprit}\n  File: file://${handled.file
			.slice(1)
			.replace(/\)$/, '')}\n  Severity: ${handled.severity ?? 'undefined'}`;
		this.core.logger.log('fatal', formattedMessage);
		const out = error.stack
			? error.stack.replace(/\n/g, '<br>')
			: formattedMessage.replace(/\n/g, '<br>');
		if (ops.noResponse) {
			if (uuid) {
				this.core.removeRequestID(uuid);
			}

			return;
		}

		if (uuid) {
			this.core.removeRequestID(uuid);
		}

		return response.status(this.codes.internalErr).send(out);
	}

	protected addFatalError(): void {
		this.fatalErrors++;
	}
}

export default Path;