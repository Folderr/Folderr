import { Response } from 'express';
import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { join } from 'path';

class Short extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Short';
        this.path = '/short/:id';
    }

    async execute(req: any, res: any): Promise<Response|void> {
        if (!req.params || !req.params.id) {
            return res.status(this.codes.badReq).send('[ERROR] Missing short ID.');
        }
        const short = await this.base.schemas.Shorten.findOne( { ID: req.params.id } );
        if (!short) {
            return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/Not_Found.html') );
        }
        return res.redirect(short.link.trim() );
    }
}

export default Short;
