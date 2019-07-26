import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../Schemas/User';
import { promisify } from 'util';
const sleep = promisify(setTimeout);

class Utils {

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     */
    static genRandomNum() {
        return Math.random() * (9);
    }

    static async sleep(ms) {
        await sleep(ms);
        return Promise.resolve();
    }

    static genUID() {
        const num = Math.floor(Math.random() * (22 - 18 + 1)) + 18;
        let uID = '';
        for (let i = 0; i < num; i++) {
            uID += String(Math.floor(Math.random() * (9 - 1 + 1)) + 1);
        }
        return Promise.resolve(uID);
    }

    static hashPass(password) {
        if (password.length < 8 || password.match(/[A-Za-z0-9_.&]/g).length < password.length) {
            throw Error('Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`');
        }
        if (password.length > 32) {
            throw Error('Password is too long, password must be under 32 characters long');
        }
        return bcrypt.hash(password, 10);
    }

    static async genToken(userID) {
        const random = crypto.randomBytes(48).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID = new Buffer.from(userID).toString('base64');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        const token = `${uID}.${random}.${date}`;
        const hash = await bcrypt.hash(token, 10);
        return { token, hash };
    }

    static async authToken(input) {
        const hash = await bcrypt.hash(input, 10);
        const user = await User.findOne({ token: hash });
        return !!user;
    }


    static async authPassword(input, userID) {
        const hash = await bcrypt.hash(input, 10);
        const user = await User.findOne({ uID: userID, password: hash });
        return !!user;
    }

}

export default Utils;
