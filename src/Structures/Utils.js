import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../Schemas/User';
import VerifyingUser from '../Schemas/VerifyingUser';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

/**
 * @class Utils
 *
 * @author Null#0515
 */
class Utils {
    /**
     * @prop {Number} saltRounds The rounds to salt with
     * @prop {Number} byteSize The amount of random bytes to generate
     */
    constructor() {
        this.saltRounds = 10;
        this.byteSize = 48;
    }

    /**
     * @returns {string}
     */
    toString() {
        return '[Evolve-X Utils]';
    }

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     *
     * @returns {Number}
     */
    genRandomNum() {
        return Math.random() * (9);
    }

    /**
     * Wait for a certain time
     * - Async/wait only
     *
     * @param {Number} ms The milliseconds to sleep for
     * @returns {Promise<void>}
     */
    async sleep(ms) {
        await sleep(ms);
        return Promise.resolve();
    }

    /**
     * Generate a user ID
     *
     * @returns {Promise<string>}
     */
    genUID() {
        const max = 22;
        const min = 18;
        const wut = 1;
        const num = Math.floor(Math.random() * (max - min + wut) ) + min;
        let uID = '';
        const maxChar = 9;
        const minChar = 1;
        for (let i = 0; i < num; i++) {
            uID += String(Math.floor(Math.random() * (maxChar - minChar + wut) ) + minChar);
        }
        return Promise.resolve(uID);
    }

    /**
     * Hash a password
     *
     * @param {String} password The password to hash
     * @returns {String}
     */
    hashPass(password) {
        const minPass = 8;
        const maxPass = 32;
        if (password.length < minPass || password.match(/[A-Za-z0-9_.&]/g).length !== password.length) {
            throw Error('Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`');
        }
        if (password.length > maxPass) {
            throw Error('Password is too long, password must be under 32 characters long');
        }
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Generate a notification ID
     *
     * @param {Object[]} notifs The notifications IDs to ignore
     * @returns {Promise<string|Promise<*>>}
     */
    async genNotifyID(notifs) {
        const ID = await this.genUID();
        const notify = notifs.find(notif => notif.id === ID);
        if (notify) {
            return this.genNotifyID();
        }
        return ID;
    }

    /**
     * Generate a users token
     *
     * @param userID
     * @returns {Promise<{hash: *, token: *}>}
     */
    async genToken(userID) {
        const random = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID = new Buffer.from(userID).toString('base64');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        const token = `${uID}.${random}.${date}`;
        const hash = await bcrypt.hash(token, this.saltRounds);
        return { token, hash };
    }

    /**
     * Generate a validation token
     *
     * @returns {Promise<{hash: String, token: String}>}
     */
    async genValidationToken() {
        const random = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const randomID = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID = new Buffer.from(randomID).toString('base64');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        const token = `${random}.${uID}.${date}`;
        const hash = await bcrypt.hash(token, this.saltRounds);
        return { token, hash };
    }

    /**
     * Authenticate a user using token and user ID
     *
     * @param {String} token The users token
     * @param {String} userID The users ID
     * @returns {Promise<void|Object>}
     */
    async authToken(token, userID) {
        const user = await User.findOne( { uID: userID } );
        if (!user) {
            return;
        }
        if (!bcrypt.compareSync(token, user.token) ) {
            return;
        }
        return user;
    }

    /**
     * Authenticate a user using password and username
     *
     * @param {String} password The users password
     * @param {String} username The users username
     * @returns {Promise<boolean>}
     */
    async authPassword(password, username) {
        const user = await User.findOne( { username } );
        if (!user) {
            return false;
        }
        if (!bcrypt.compareSync(password, user.password) ) {
            return false;
        }
        return user;
    }

    /**
     * Find and return a verifying user from the schema if any
     *
     * @param {String} validationToken The validation token to search for
     * @param {String} userID The user IDs to look for
     * @returns {Promise<boolean>}
     */
    async findVerifying(validationToken, userID) {
        const user = await VerifyingUser.findOne( { uID: userID } );
        if (!user) {
            return false;
        }
        if (!bcrypt.compareSync(validationToken, user.validationToken) ) {
            return false;
        }
        return user;
    }
}

export default Utils;
