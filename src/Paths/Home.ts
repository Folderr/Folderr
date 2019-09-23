import Path from '../../src/Structures/Path';
import Evolve from '../Structures/Evolve';
import { Response } from 'express';
import Base from '../Structures/Base';
import { join } from 'path';

class Home extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Homepage';

        this.path = '/';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response> {
        const dir = join(__dirname, '../Frontend/HTML/Home.html');
        if (req.cookies && req.cookies.token) {
            const auth = await this.Utils.authBearerToken(req.cookies);
            if (!auth || typeof auth === 'string') {
                res.clearCookie('token');
                return res.sendFile(dir);
            }
            return res.sendFile(join(__dirname, '../Frontend/HTML/Home_LoggedIn.html') );
        }
        return res.sendFile(dir);
    }
}

export default Home;
