import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../Schemas/User';
import VerifyingUser from '../Schemas/VerifyingUser';
import { promisify } from 'util';
import {Document} from "mongoose";

const sleep = promisify(setTimeout);

interface notification {
    title: string;
    notify: string;
    ID: string;
}

interface IUser extends Document {
    uID: string;
    password: string;
    token?: string;
    first?: boolean;
    username: string;
    admin?: boolean;
    notifs?: notification[];
}

interface tokenReturn {
    token: string;
    hash: string;
}

interface notification {
    ID: string;
    title: string;
    notify: string;
}

interface IVUser extends Document {
    uID: string;
    password: string;
    username: string;
    validationToken: string;
}

/**
 * @class Utils
 *
 * @author Null#0515
 */
class Utils {
    public saltRounds: number;
    public byteSize: number;
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
    toString(): string {
        return '[Evolve-X Utils]';
    }

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     *
     * @returns {Number}
     */
    genRandomNum(): number {
        return Math.random() * (9);
    }

    /**
     * Wait for a certain time
     * - Async/wait only
     *
     * @param {Number} ms The milliseconds to sleep for
     * @returns {Promise<void>}
     */
    async sleep(ms: number): Promise<void> {
        await sleep(ms);
        return Promise.resolve();
    }

    /**
     * Generate a user ID
     *
     * @returns {Promise<string>}
     */
    genUID(): Promise<string> {
        // Minimum and max id length
        const max = 22;
        const min = 18;
        // What is wut??
        const wut = 1;
        // pick between 18 and 22
        const num = Math.floor(Math.random() * (max - min + wut) ) + min;
        let uID = '';
        // Min and max numbers
        const maxChar = 9;
        const minChar = 1;
        // Generate the user ID
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
    hashPass(password: string): Promise<string> {
        // Minimum and max password lengths
        const minPass = 8;
        const maxPass = 32;
        // If the password is not over min length
        // If password does not match the regex completely
        const match: RegExpMatchArray | null = password.match(/[A-Za-z0-9_.&]/g);
        if (password.length < minPass || (match && match.length !== password.length) ) {
            throw Error('Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`');
        }
        // If the password is too long
        if (password.length > maxPass) {
            throw Error('Password is too long, password must be under 32 characters long');
        }
        // Hash and return
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Generate a notification ID
     *
     * @param {Object[]} notifs The notifications IDs to ignore
     * @returns {Promise<string|Promise<*>>}
     */
    async genNotifyID(notifs: notification[]): Promise<string> {
        // Gen the ID, and dont let the ID equal a already made notify id
        const ID: string = await this.genUID();
        const notify: notification | undefined = notifs.find(notif => notif.ID === ID);
        if (notify) {
            // Retry if notify exists
            return this.genNotifyID(notifs);
        }
        // Return the ID
        return ID;
    }

    /**
     * Generate a users token
     *
     * @param userID
     * @returns {Promise<{hash: *, token: *}>}
     */
    async genToken(userID: string): Promise<tokenReturn> {
        // Generate random bytes, create buffer from user id
        // Oh and get a base64 date in milliseconds
        const random: string = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID = Buffer.from(userID).toString('base64');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        // Combine, hash, and return the hashed and unhashed token
        const token = `${uID}.${random}.${date}`;
        const hash = await bcrypt.hash(token, this.saltRounds);
        return { token, hash };
    }

    /**
     * Generate a validation token
     *
     * @returns {Promise<{hash: String, token: String}>}
     */
    async genValidationToken(): Promise<tokenReturn> {
        // Generate random bytes, gen more random bytes
        // Oh and get a base64 date in milliseconds
        const random: string = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const randomID: string = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID: string = Buffer.from(randomID).toString('base64');
        const date: string = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        // Combine, hash, and return unhashed and hashed versions
        const token: string = `${random}.${uID}.${date}`;
        const hash: string = await bcrypt.hash(token, this.saltRounds);
        return { token, hash };
    }

    /**
     * Authenticate a user using token and user ID
     *
     * @param {String} token The users token
     * @param {String} userID The users ID
     * @returns {Promise<void|Object>}
     */
    async authToken(token: string, userID: string): Promise<IUser|false> {
        // Find the user via ID, if no user the auth failed
        const user = await User.findOne( { uID: userID } );
        if (!user) {
            return false;
        }
        // IO tokens do not match, auth failed... Else return user
        if (!bcrypt.compareSync(token, user.token) ) {
            return false;
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
    async authPassword(password: string, username: string): Promise<IUser|false> {
        // Find user on username, and if no user auth failed
        const user = await User.findOne( { username } );
        if (!user) {
            return false;
        }
        // Compare actual password and inputted password. If they do not match, fail
        if (!bcrypt.compareSync(password, user.password) ) {
            return false;
        }
        // Return the user
        return user;
    }

    /**
     * Find and return a verifying user from the schema if any
     *
     * @param {String} validationToken The validation token to search for
     * @param {String} userID The user IDs to look for
     * @returns {Promise<boolean>}
     */
    async findVerifying(validationToken: string, userID: string): Promise<IUser|false> {
        const user: IVUser | null = await VerifyingUser.findOne( { uID: userID } );
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
