import Path from '../../Structures/Path';

class Signup extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Signup';

        this.path = '/api/signup';
        this.type = 'post';
        this.load = true;
    }

    async genUID() {
        const uID = await this.Utils.genUID();
        const user = await this.base.schemas.User.findOne( { uID } );
        if (user) {
            return this.genUID();
        }
        return uID;
    }

    async execute(req, res) {
        if (!this.base.options.signups) {
            return res.status(this.codes.locked).send('[WARN] Signups are closed.');
        }

        if (!req.body || (req.body && (!req.body.username || !req.body.password) ) ) {
            if (req.body && (req.body.email || req.body.username || req.body.password) ) {
                return res.status(this.codes.partial_content).send('[ERROR] You have one part of the signup process, but not all.');
            }
            return res.status(this.codes.no_content).send('[ERROR] You have none of the content needed for account creation.');
        }

        const { username, password } = req.body;
        const maxUsername = 12;
        const minUsername = 3;
        if (username.length > maxUsername || username.length < minUsername) {
            return res.status(this.codes.bad_req).send('[ERROR] Password must be between 3 and 12 characters!');
        } if (username.length !== username.match(/[a-z0-9_]/g).length) {
            return res.status(this.codes.bad_req).send('[ERROR] Password may only contain lowercase letters, numbers, and an underscore.');
        }

        const user = await this.base.schemas.User.findOne( { username } ) || await this.base.schemas.VerifyingUser.findOne( { username } );
        if (user) {
            return res.status(this.codes.used).send('[ERRORR] Username taken!');
        }

        let pswd;
        try {
            pswd = await this.Utils.hashPass(password);
        } catch (err) {
            console.log(`[ERROR] [Signup -  Create password] - ${err}`);
            return res.status(this.codes.internal_err).send(`[ERROR] ${err.message}`);
        }

        const failed = false;
        const failedMess = '';

        const uID = await this.genUID();
        const validationToken = await this.Utils.genValidationToken(uID);
        const nUser = new this.base.schemas.VerifyingUser( { uID, password: pswd, username, validationToken: validationToken.hash } );
        await nUser.save();

        const admins = await this.base.schemas.User.find( { admin: true } );
        let success = 0;
        for (let admin of admins) {
            try {
                const notifyID = await this.Utils.genNotifyID(admin.notifs);
                admin.notifs.push( {
                    ID: notifyID,
                    notify: `User ID: ${uID}\nValidation Token: ${validationToken.token}`,
                    title: 'New user signup!',
                } );
                admin = await this.base.schemas.User.findOneAndUpdate( { uID: admin.uID }, admin).exec();
                success++;
            } catch (err) {
                console.log(`[ERROR] - [Signup.execute] - Error updating notifications for admin ${admin.uID} - ${err.message || err}`);
            }
        }
        console.log(`[SIGNUP] Notified ${success}/${admins.length} admins about verifying user ${uID}`);
        if (failed) {
            return res.status(this.codes.internal_err).send(failedMess);
        }
        return res.status(this.codes.created).send('[SUCCESS] The admins have been notified of your account request!');
    }
}

export default Signup;
