import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { UserI } from '../../Schemas/User';
import { Request, Response } from 'express';
import { isArray } from 'util';

interface UpdReturns {
    code: number;
    mess: string;
}

class UpdateAcc extends Path {
    private keys: { '0': string; '1': string };

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

    async updateUsername(user: UserI, name: string): Promise<UpdReturns> {
        // Max and min username lengths
        const maxUsername = 12;
        const minUsername = 3;
        // If username does not match length criteria error
        const match = name.match(/[a-z0-9_]/g);
        if (name.length > maxUsername || name.length < minUsername) {
            return { code: this.codes.badReq, mess: '[ERROR] Password must be between 3 and 12 characters!' };
        } if (match && name.length !== match.length) { // If username does not matdch regex pattern error
            return { code: this.codes.badReq, mess: '[ERROR] Password may only contain lowercase letters, numbers, and an underscore.' };
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
            return { code: this.codes.internalErr, mess: `[ERROR] ${err.message || err}` };
        }

        return { code: this.codes.ok, mess: '[SUCCESS] Account Updated!' };
    }

    async updatePassword(user: UserI, pass: string): Promise<UpdReturns> {
        let pswd;
        try {
            // Hash password
            pswd = await this.Utils.hashPass(pass);
        } catch (err) {
            // If there was an error, tell the user and the server
            console.log(`[ERROR] [Update Account - Update password] - ${err}`);
            return { code: this.codes.internalErr, mess: `[ERROR] ${err.message}` };
        }

        try {
            // Try to update the users password and save the account
            user.password = pswd;
            await user.save();
        } catch (err) {
            // If there was an error alert the server and the user
            console.log(`[ERROR] [Update Account - Update password] - ${err}`);
            return { code: this.codes.internalErr, mess: `[ERROR] ${err.message}` };
        }

        return { code: this.codes.ok, mess: '[SUCCESS] Account Updated!' };
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // Check headers
        if (!req.headers.password && !req.headers.username) {
            return res.status(this.codes.noContent).send('[ERROR] Missing authorization password and username!');
        }
        if (!req.headers.password || !req.headers.username) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing either authorization password or username!');
        }
        if (isArray(req.headers.password) || isArray(req.headers.username) ) {
            return res.status(this.codes.badReq).send('[ERROR] Neither header auth field may be an array!');
        }
        // Check pass/username auth
        const auth = await this.Utils.authPassword(req.headers.password, req.headers.username);
        if (!auth) {
            return res.status(this.codes.unauth).send('[ERROR] Authorization failed. Who are you?');
        }
        // Check the query and new_key are correct
        if (!req.query || !req.query.key || !req.body || !req.body.new_key) {
            return res.status(this.codes.noContent).send('[ERROR] Key you are updating is needed!');
        }
        // Verify the key
        const ke = Number(req.query.key) as 0|1;
        const key = this.keys[ke];
        if (!key) {
            return res.status(this.codes.badReq).send('[ERROR] That key does not exist!');
        }

        // Basic output  incase no output happens for some weird reason
        let out = { code: this.codes.internalErr, mess: 'Something unknown happened' };
        try {
            // Pick a key to update, and make sure it does not match the old key
            if (key === 'username') {
                if (req.body.new_key === req.headers.username) {
                    // If the new key matches the old, error
                    return res.status(this.codes.badReq).send('[ERROR] Your new username cannot be your old username!');
                }
                // Update the username
                out = await this.updateUsername(auth as UserI, req.body.new_key);
            } else if (key === 'password') {
                if (req.body.new_key === req.headers.password) {
                    // If the new key matches the old, error
                    return res.status(this.codes.badReq).send('[ERROR] Your new password cannot be your old password!');
                }
                // Update the password
                out = await this.updatePassword(auth as UserI, req.body.new_key);
            }
        } catch (err) {
            // If there was some obscure error, handle it
            return res.status(this.codes.internalErr).send(`[ERROR] ${err.message || err}`);
        }

        // Return the output
        return res.status(out.code).send(out.mess);
    }
}

export default UpdateAcc;