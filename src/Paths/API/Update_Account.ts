import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import {Document} from "mongoose";
import {Request, Response} from "express";
import {isArray} from "util";

interface notification {
    title: string;
    notify: string;
    ID: string;
}

interface IUser extends Document {
    uID: string;
    password: string;
    token: string;
    first?: boolean;
    username: string;
    admin?: boolean;
    notifs?: notification[];
}

interface updReturns {
    code: number;
    mess: string;
}

class UpdateAcc extends Path {
    private keys: { "0": string; "1": string };
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Update Account';
        // this.load = false;
        this.path = '/api/account';

        this.type = 'patch';

        this.keys = {
            0: 'username',
            1: 'password',
        };
    }

    async updateUsername(user: IUser, name: string): Promise<updReturns> {
        // Max and min username lengths
        const maxUsername = 12;
        const minUsername = 3;
        // If username does not match length criteria error
        const match = name.match(/[a-z0-9_]/g);
        if (name.length > maxUsername || name.length < minUsername) {
            return { code: this.codes.bad_req, mess: '[ERROR] Password must be between 3 and 12 characters!' };
        } else if (match && name.length !== match.length) { // If username does not matdch regex pattern error
            return { code: this.codes.bad_req, mess: '[ERROR] Password may only contain lowercase letters, numbers, and an underscore.' };
        }

        // See if the user exists within the database, if so, error
        const users = await this.base.schemas.User.find();
        const usr = users.find(u => u.username === name);
        if (usr) {
            return { code: this.codes.used, mess: '[ERROR] Username taken!' };
        }

        try {
            // Update the name and save the user
            user.username = name;
            await user.save();
        } catch (err) { // Lightly handle errors
            return { code: this.codes.internal_err, mess: `[ERROR] ${err.message || err}` };
        }

        return { code: this.codes.ok, mess: '[SUCCESS] Account Updated!' };
    }

    async updatePassword(user: IUser, pass: string): Promise<updReturns> {
        let pswd;
        try {
            // Hash password
            pswd = await this.Utils.hashPass(pass);
        } catch (err) {
            // If there was an error, tell the user and the server
            console.log(`[ERROR] [Update Account - Update password] - ${err}`);
            return { code: this.codes.internal_err, mess: `[ERROR] ${err.message}` };
        }

        try {
            // Try to update the users password and save the account
            user.password = pswd;
            await user.save();
        } catch (err) {
            // If there was an error alert the server and the user
            console.log(`[ERROR] [Update Account - Update password] - ${err}`);
            return { code: this.codes.internal_err, mess: `[ERROR] ${err.message}` };
        }

        return { code: this.codes.ok, mess: '[SUCCESS] Account Updated!' };
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.no_content).send('[ERROR] Missing authorization password and username!');
        }
        if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partial_content).send('[ERROR] Missing either authorization password or username!');
        }
        if (isArray(req.headers.password) || isArray(req.headers.username) ) {
            return res.status(this.codes.bad_req).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check pass/username auth
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }
        // Check the query and new_key are correct
        if (!req.query || !req.query.key || !req.body || !req.body.new_key) {
            return res.status(this.codes.no_content).send('[ERROR] Key you are updating is needed!');
        }
        // Verify the key
        const ke = <0|1>Number(req.query.key);
        const key = this.keys[ke];
        if (!key) {
            return res.status(this.codes.bad_req).send('[ERROR] That key does not exist!');
        }

        // Basic output  incase no output happens for some weird reason
        let out = { code: this.codes.internal_err, mess: 'Something unknown happened' };
        try {
            // Pick a key to update, and make sure it does not match the old key
            if (key === 'username') {
                if (req.body.new_key === req.headers.username) {
                    // If the new key matches the old, error
                    return res.status(this.codes.bad_req).send('[ERROR] Your new username cannot be your old username!');
                }
                // Update the username
                out = await this.updateUsername(<IUser>auth, req.body.new_key);
            } else if (key === 'password') {
                if (req.body.new_key === req.headers.password) {
                    // If the new key matches the old, error
                    return res.status(this.codes.bad_req).send('[ERROR] Your new password cannot be your old password!');
                }
                // Update the password
                out = await this.updatePassword(<IUser>auth, req.body.new_key);
            }
        } catch (err) {
            // If there was some obscure error, handle it
            return res.status(this.codes.internal_err).send(`[ERROR] ${err.message || err}`);
        }

        // Return the output
        return res.status(out.code).send(out.mess);
    }
}

export default UpdateAcc;
