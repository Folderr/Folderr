import { Request, Response } from 'express';
import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';

class Short extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Short';
        this.path = '/short/:id';
    }

    async execute(req: Request, res: Response): Promise<Response|void> {
        if (!req.params || !req.params.id) {
            return res.status(this.codes.partialContent).send('[ERROR] Missing short ID.');
        }
        const short = await this.base.schemas.Shorten.findOne( { ID: req.params.id } );
        if (!short) {
            return res.status(this.codes.notFound);
        }
        return res.redirect(short.link);
    }
}

export default Short;