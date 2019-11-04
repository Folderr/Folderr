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
        const dir = join(__dirname, '../Frontend/Home.html');
        if (req.uauth) {
            return res.sendFile(join(__dirname, '../Frontend/LoggedIn.html') );
        }
        return res.sendFile(dir);
    }
}

export default Home;
