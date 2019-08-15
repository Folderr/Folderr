import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Request, Response } from 'express';

class Signup extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Signup';

        this.path = '/api/signup';
        this.type = 'post';
    }

    async genUID(): Promise<string> {
        // Generate an ID, and do not allow a users id to be reused
        const uID = await this.Utils.genUID();
        const user = await this.base.schemas.User.findOne( { uID } );
        if (user) { // If the user was found, retry
            return this.genUID();
        }
        // Return user id
        return uID;
    }

    async execute(req: Request, res: Response): Promise<Response> {
        // If signups are closed, state that and do not allow them tthrough
        if (!this.base.options.signups) {
            return res.status(this.codes.locked).send('[WARN] Signup\'s are closed.');
        }

        // Check all required body is there
        if (!req.body || (req.body && (!req.body.username || !req.body.password) ) ) {
            if (req.body && (req.body.email || req.body.username || req.body.password) ) {
                return res.status(this.codes.partialContent).send('[ERROR] You have one part of the signup process, but not all.');
            }
            return res.status(this.codes.noContent).send('[ERROR] You have none of the content needed for account creation.');
        }

        // Fetch the username and password from the body
        const { username, password } = req.body;
        // Max and min username lengths
        const maxUsername = 12;
        const minUsername = 3;
        // If the username length does not match criteria
        if (username.length > maxUsername || username.length < minUsername) {
            return res.status(this.codes.badReq).send('[ERROR] Password must be between 3 and 12 characters!');
        } if (username.length !== username.match(/[a-z0-9_]/g).length) { // If the username doess not match our username pattern
            return res.status(this.codes.badReq).send('[ERROR] Password may only contain lowercase letters, numbers, and an underscore.');
        }

        // See if the username is already taken. If its taken error the request with a code of "IM USED"
        const user = await this.base.schemas.User.findOne( { username } ) || await this.base.schemas.VerifyingUser.findOne( { username } );
        if (user) {
            return res.status(this.codes.used).send('[ERROR] Username taken!');
        }

        // Hash the password and catch errors
        let pswd;
        try {
            pswd = await this.Utils.hashPass(password);
        } catch (err) {
            // Errors shouldnt happen here, so notify the console.. Also notify the user
            console.log(`[ERROR] [SIGNUP -  Create password] - ${err}`);
            return res.status(this.codes.internalErr).send(`[ERROR] ${err.message}`);
        }

        // Generate the user ID and validation token.
        const uID = await this.genUID();
        const validationToken = await this.Utils.genValidationToken();
        // Add the user to the VerifyingUser database and save
        const nUser = new this.base.schemas.VerifyingUser( { uID, password: pswd, username, validationToken: validationToken.hash } );
        await nUser.save();

        // Find admin notifications, and generate an ID
        const notifs = await this.base.schemas.AdminNotifs.find();
        const notifyID = await this.Utils.genNotifyID(notifs);
        // Make a new notification and save to database
        const notify = new this.base.schemas.AdminNotifs( {
            ID: notifyID,
            title: 'New user signup!',
            notify: `Username: ${username}\nUser ID: ${uID}\nValidation Token: ${validationToken.token}`,
        } );
        await notify.save();
        // Notify the console, and the user that the admins have been notified.
        console.log(`[SIGNUP] Notified admins about verifying user ${uID}`);
        return res.status(this.codes.created).send('[SUCCESS] The admins have been notified of your account request!');
    }
}

export default Signup;
