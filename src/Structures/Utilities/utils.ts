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

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {User as UI, PendingMember} from '../Database/db-class';
import {FoldCodesI, FoldCodes} from './fold-codes';
import {promisify} from 'util';
import {Request} from 'express';
import Core from '../core';
import Authorization from './authorization';
import {KeyConfig} from '../../handlers/config-handler';
import * as constants from '../constants/index';

const sleep = promisify(setTimeout);

interface TokenReturn {
	token: string;
	hash: string;
}

/**
 * @param {Folderr} core The Core of the project
 *
 * @classdesc A lot of utility functions
 */
class Utils {
	public saltRounds: number;

	public byteSize: number;

	public authorization: Authorization;

	public FoldCodes: FoldCodesI;

	#core: Core;

	/**
	 * @constructor
	 *
	 * @prop {number} saltRounds The rounds to salt with
	 * @prop {number} byteSize The amount of random bytes to generate
	 * @prop {Core} core The Folderr client
	 */
	constructor(core: Core, jwtConfig: KeyConfig['jwtConfig']) {
		this.saltRounds = 10;
		this.byteSize = 48;
		this.#core = core;
		this.authorization = new Authorization(jwtConfig, core);
		this.FoldCodes = FoldCodes;
	}

	/**
	 * @desc Make Utils look pretty when inspected
	 *
	 * @returns {string}
	 */
	toString(): string {
		return '[Core Utils]';
	}

	/**
	 * @desc Returns a random number between min (inclusive) and max (exclusive)
	 *
	 * @generator
	 *
	 * @returns {number}
	 */
	genRandomNum(): number {
		return Math.random() * 9;
	}

	/**
	 * @desc Wait for a certain time
	 * - Async/wait only
	 * @async
	 *
	 * @param {Number} ms The milliseconds to sleep for
	 * @returns {Promise<void>}
	 * @author KhaaZ
	 */
	// Taken from https://github.com/Khaazz/AxonCore/blob/d597089b80615fdd5ceab8f0a1b1d83f70fc5187/src/Utility/Utils.js#L355
	async sleep(ms: number): Promise<void> {
		await sleep(ms);
		return Promise.resolve();
	}

	/**
	 * @desc Generate a user ID
	 * @generator
	 *
	 * @returns {Promise<string>}
	 */
	async genUID(): Promise<string> {
		// Minimum and max id length
		const max = 22;
		const min = 18;
		// What is wut??
		const wut = 1;
		// Pick between 18 and 22
		const number = Math.floor(Math.random() * (max - min + wut)) + min;
		let uID = '';
		// Min and max numbers
		const maxChar = 9;
		const minChar = 1;
		// Generate the user ID
		for (let i = 0; i < number; i++) {
			uID += String(
				Math.floor(Math.random() * (maxChar - minChar + wut)) + minChar
			);
		}

		return Promise.resolve(uID);
	}

	/**
	 * @desc Generate a ID
	 * @generator
	 *
	 * @param {object[]} things The things to avoid generating a duplicate ID for
	 *
	 * @returns {Promise<string>}
	 */
	async genID(): Promise<string> {
		// Generate a random ID
		const bytesToGen = 10;
		const min = 10;
		const max = 7;
		const id = crypto
			.randomBytes(bytesToGen)
			.toString('base64')
			.replace(/[+/=\\]/g, '')
			.slice(min, max);
		let toReturn = true;
		const [Upload, Link] = await Promise.all([
			this.#core.db.findFile({ID: id}, 'ID'),
			this.#core.db.findLink({ID: id}, 'ID')
		]);
		if (Upload || Link) {
			toReturn = false;
		}

		if (!toReturn) {
			return this.genID();
		}

		return id;
	}

	/**
	 * @desc Hash a password
	 * @async
	 *
	 * @param {string} password The password to hash
	 * @returns {string}
	 */
	async hashPass(password: string): Promise<string> {
		// Minimum and max password lengths
		const minPass = 8;
		const maxPass = 32;
		// If the password is not over min length
		// If password does not match the regex completely
		const match: boolean = this.#core.regexs.password.test(password);
		if (password.length < minPass || match) {
			throw new Error( // eslint disable-next-line max-len
				`[PSW1] ${constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS}`
			);
		}

		// If the password is too long
		if (password.length > maxPass) {
			throw new Error(
				`[PSW2] ${constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_LENGTH_EXCEED}`
			);
		}

		if (password.includes('\0')) {
			throw new Error(`[PSW3] ${constants.ENUMS.RESPONSES.PASSWORD.NO_NUL}`);
		}

		// Hash and return
		return bcrypt.hash(password, this.saltRounds);
	}

	/**
	 * @desc Generate a notification ID
	 * @generator
	 * @async
	 *
	 * @param {Object[]} notifs The notifications IDs to ignore
	 * @returns {Promise<string|Promise<*>>}
	 */
	async genNotifyID(): Promise<string> {
		// Gen the ID, and dont let the ID equal a already made notify id
		const ID: string = await this.genUID();
		const notify = await this.#core.db.findAdminNotify({ID});
		if (notify) {
			// Retry if notify exists
			return this.genNotifyID();
		}

		// Return the ID
		return ID;
	}

	/**
	 * @desc Generate a validation token
	 * @generator
	 * @async
	 *
	 * @returns {Promise<{hash: string, token: string}>}
	 */
	async genValidationToken(): Promise<TokenReturn> {
		// Generate random bytes, gen more random bytes
		// Oh and get a base64 date in milliseconds
		const r: string = crypto.randomBytes(this.byteSize).toString();
		const random: string = crypto
			.randomBytes(this.byteSize)
			.toString('base64')
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, '_');
		const uID = Buffer.from(r)
			.toString('base64')
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, '_');
		const date = Buffer.from(new Date().getUTCMilliseconds().toString())
			.toString('base64')
			.replace(/[`#%"<>|^=/.?:@&+\\-]/g, '_');
		// Combine, hash, and return the hashed and unhashed token
		const token = `${uID}.${random}.${date}`;
		const hash = await bcrypt.hash(token, this.saltRounds);
		return {token, hash};
	}

	/**
	 * @desc Authenticate a user using password and username
	 * @async
	 *
	 * @param {Request} req The express request.
	 * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
	 *
	 * @returns {Promise<boolean>}
	 */
	async authPassword(
		request: Request,
		fn?: (arg0: UI) => boolean
	): Promise<UI | false> {
		// Make sure all of the auth stuff is there
		if (!request.headers.password && !request.headers.username) {
			return false;
		}

		if (!request.headers.password || !request.headers.username) {
			return false;
		}

		// Make sure the auth is not an array. Arrays are bad for auth
		if (
			Array.isArray(request.headers.password) ||
			Array.isArray(request.headers.username)
		) {
			return false;
		}
		// Find user on username, and if no user auth failed

		const user = await this.#core.db.findUser({
			username: request.headers.username
		});
		if (!user) {
			return false;
		}

		// Compare actual password and inputted password. If they do not match, fail
		if (!bcrypt.compareSync(request.headers.password, user.password)) {
			return false;
		}

		// If the custom function exists
		if (fn) {
			const funcOut = fn(user); // Run the custom function (boolean)
			if (!funcOut || !(typeof funcOut === 'boolean')) {
				return false;
			}
		}

		user.email = this.decrypt(user.email);
		// Return the user
		return user;
	}

	/**
	 * @desc Authenticate a user using password and username
	 * @async
	 *
	 * @param {Request} req The express request.
	 * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
	 *
	 * @returns {Promise<boolean>}
	 */
	async authPasswordBody(
		request: Request,
		fn?: (arg0: UI) => boolean
	): Promise<UI | false> {
		// Make sure all of the auth stuff is there
		if (!request.body.password && !request.body.username) {
			return false;
		}

		if (!request.body.password || !request.body.username) {
			return false;
		}

		// Make sure the auth is not an array. Arrays are bad for auth
		if (
			Array.isArray(request.body.password) ||
			Array.isArray(request.body.username)
		) {
			return false;
		}

		// Find user on username, and if no user auth failed
		const user = await this.#core.db.findUser({
			username: request.body.username
		});
		if (!user) {
			return false;
		}

		// Compare actual password and inputted password. If they do not match, fail
		if (!bcrypt.compareSync(request.body.password, user.password)) {
			return false;
		}

		// If the custom function exists
		if (fn) {
			const funcOut = fn(user); // Run the custom function (boolean output)
			if (!funcOut || !(typeof funcOut === 'boolean')) {
				return false;
			}
		}

		user.email = this.decrypt(user.email);
		// Return the user
		return user;
	}

	/**
	 * @desc Determines if the user allows insecuce requests
	 * @param req ExpressJS request
	 *
	 * @returns {boolean}
	 */
	verifyInsecureCookies(request: Request): boolean {
		if (!request.cookies) {
			return false;
		}

		if (!request.cookies.i) {
			return false;
		}

		if (request.cookies.i !== 't') {
			return false;
		}

		return true;
	}

	/**
	 * @desc Find and return a verifying user from the schema if any
	 * @async
	 *
	 * @param {String} validationToken The validation token to search for
	 * @param {String} userID The user IDs to look for
	 * @returns {Promise<boolean>}
	 */
	async findVerifying(
		validationToken: string,
		userID: string
	): Promise<PendingMember | false> {
		const user: PendingMember | undefined | null =
			await this.#core.db.findVerify({userID});
		if (!user) {
			return false;
		}

		if (!bcrypt.compareSync(validationToken, user.validationToken)) {
			return false;
		}

		return user;
	}

	async testMirrorURL(url: string): Promise<boolean> {
		try {
			const test = await this.#core.superagent.get(`${url}/api`);
			if (
				test?.text &&
				JSON.parse(test?.text)?.message?.res === 'Pong! Mirror Operational!'
			) {
				return true;
			}

			return false;
		} catch {
			return false;
		}
	}

	async determineHomeURL(request: Request): Promise<string> {
		const protocol = `${request.protocol || 'http'}://`;
		let host = request.get('host') ?? request.get('Host');
		if (!host) {
			host = this.#core.config.url;
		}

		try {
			const test = await this.#core.superagent.get(
				`${this.#core.config.url}/api`
			);
			if (test?.text && JSON.parse(test?.text)?.message?.message === 'Pong!') {
				return this.#core.config.url;
			}

			return `${protocol}${host}`;
		} catch {
			return `${protocol}${host}`;
		}
	}

	// Fake encrypt & decrypt methods
	// :)
	encrypt(data: string): string {
		return Buffer.from(data, 'utf8').toString('hex');
	}

	decrypt(data: string): string {
		return Buffer.from(data, 'hex').toString('utf8');
	}
}

export default Utils;