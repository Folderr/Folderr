import Path from '../../src/Structures/Path';
import Evolve from '../Structures/Evolve';
import { Response } from 'express';
import Base from '../Structures/Base';

class Home extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Homepage';

        this.path = '/';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response> {
        // Basic hello world page
        return res.send('Hello World!');
    }
}

export default Home;
