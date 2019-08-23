import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';

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
        const ext = image.type || `image/${image.path.split('.')[1]}`;
        res.set('Content-Type', ext);

        return res.status(this.codes.ok).sendFile(image.path);
    }
}

export default Images;
