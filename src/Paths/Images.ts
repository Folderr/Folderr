import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import mime from 'mime-types';

class Images extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Images ID';
        this.path = '/images/:id';
    }

    async execute(req: any, res: any): Promise<Response | void> {
        if (!req.params || !req.params.id) {
            return res.status(this.codes.badReq).send('[ERROR] Missing image ID.');
        }
        const image = await this.base.schemas.Image.findOne( { ID: req.params.id } );
        if (!image) {
            return res.status(this.codes.notFound).send('Image not found!');
        }
        const content = mime.contentType(image.path);
        if (!content) {
            return res.status(this.codes.notFound).send('Image type not found!');
        }
        res.setHeader('Content-Type', content);

        return res.sendFile(image.path);
    }
}

export default Images;
