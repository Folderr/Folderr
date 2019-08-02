import Path from "../../Structures/Path";

class ClearNotifs extends Path {
    constructor(evolve, base) {
        super(evolve, base);
        this.label = '[API] Clear Notifications';
        this.path = '/api/notifs';

        this.type = 'delete';
    }

    async execute(req, res) {
        if (!req.headers.token && !req.headers.uid) {
            return res.status(204).send('[ERROR] - Missing authorization token and user ID!');
        } else if (!req.headers.token || !req.headers.uid) {
            return res.status(206).send('[ERROR] - Missing either authorization token or user ID!')
        }
        const auth = await this.Utils.authToken(req.headers.token, req.headers.uid);
        if (!auth) {
            return res.status(401).send('[ERROR] - Authorization failed. Who are you?');
        }

        auth.notifs = [];
        await this.base.schemas.User.findOneAndUpdate({ uID: auth.uID }, auth);
        return res.status(200).send('[SUCCESS] Notifications cleared!');
    }
}

export default ClearNotifs;
