import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class About extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'About';
        this.enabled = !this.base.options.apiOnly;
        this.path = '/about';
    }

    execute(req: any, res: any): Promise<Response | void> {
        return res.sendFile(join(__dirname, '../Frontend/HTML/About.html') );
    }
}

export default About;
