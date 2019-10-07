import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import * as fs from 'fs';

class DeleteImage extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Delete Image';
        this.path = '/api/image';
        this.type = 'delete';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        if (!req.query || !req.query.id) {
            return res.status(this.codes.badReq).send('[ERROR] Missing Image ID!');
        }

        const Image = await this.base.schemas.Image.findOne( { owner: auth.uID, ID: req.query.id } );
        if (!Image) {
            return res.status(this.codes.notFound).send('[ERROR] Image not found!');
        }

        if (fs.existsSync(Image.path) ) {
            fs.unlinkSync(Image.path);
        }
        await this.base.schemas.Image.deleteOne(Image);
        console.log(`[INFO - IMAGES] - Image ${Image.ID} removed!`);
        return res.status(this.codes.ok).send('[SUCCESS] Image removed!');
    }
}

export default DeleteImage;
