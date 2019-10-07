import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Users extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Users';
        this.path = '/api/users';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = !req.cookies || !req.cookies.token || !req.cookies.token.startsWith('Bearer') ? await this.Utils.authToken(req, (user) => !!user.admin) : await this.Utils.authBearerToken(req.cookies, (user) => !!user.admin);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Image.find( {} );
        const shorts = await this.base.schemas.Shorten.find( {} );

        const users = await this.base.schemas.User.find( {} );
        const arr = [];
        for (const user of users) {
            const obj = {
                username: user.username,
                uID: user.uID,
                title: '',
                images: images.filter(image => image.owner === user.uID).length,
                shorts: shorts.filter(short => short.owner === user.uID).length,
            };
            if (user.first) {
                obj.title = 'Owner';
            } else if (user.admin) {
                obj.title = 'Admin';
            }
            if (user.uID === auth.uID) {
                obj.username += ' (You)';
            }
            arr.push(obj);
        }
        return res.status(this.codes.ok).send(arr);
    }
}

export default Users;
