import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';

class Pong extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Pong';
        this.path = '/api/';
        this.type = 'get';
    }

    execute(req: any, res: any): Promise<Response | void> {
        return res.status(this.codes.ok).send('Pong!');
    }
}

export default Pong;
