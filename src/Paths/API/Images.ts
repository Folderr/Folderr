import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { ImageI } from '../../Schemas/Image';

class Images extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Images';
        this.path = '/api/images';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }

        let images: ImageI[] | string[] = await this.base.schemas.Image.find( { owner: auth.uID } );
        if (!images) {
            return res.status(this.codes.ok).send( [] );
        }
        images = images.map(image => {
            const split = image.path.split('.');
            const type = split[split.length - 1];
            return `${this.base.options.url}/images/${image.ID}.${type}`;
        } );
        return res.status(this.codes.ok).send(images);
    }
}

export default Images;
