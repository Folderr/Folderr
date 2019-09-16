import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import mime from 'mime-types';
import { join } from 'path';

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
        if (!req.params.id.match('.') ) {
            return res.status(this.codes.badReq).send('Missing file extension!');
        }
        const parts = req.params.id.split('.');
        if (!parts[1] ) {
            return res.status(this.codes.internalErr).send('500 Internal Error');
        }
        const image = await this.base.schemas.Image.findOne( { ID: parts[0] } );
        if (!image) {
            return res.status(this.codes.notFound).sendFile(join(__dirname, '../Frontend/Not_Found.html') );
        }
        let content = mime.contentType(image.path);
        const arr = image.path.split('.');
        if (arr[arr.length - 1] !== parts[1] ) {
            return res.status(this.codes.internalErr);
        }
        if (!content) {
            return res.status(this.codes.notFound).send('Image type not found!');
        }
        if (content !== image.path) {
            res.setHeader('Content-Type', content);
        } else {
            content = `image/${arr[arr.length - 1].toLowerCase()}`;
            res.setHeader('Content-Type', content);
        }


        return res.sendFile(image.path);
    }
}

export default Images;
