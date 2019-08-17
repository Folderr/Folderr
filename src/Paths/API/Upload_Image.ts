import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import formidable from 'formidable';
import { join } from 'path';

class Image extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Upload Image';
        this.path = '/api/image';
        this.type = 'post';
    }

    async execute(req: any, res: any): Promise<Response|void> {
        const auth = await this.Utils.authToken(req);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Image.find();
        const path = join(__dirname, '../../Images/');
        const name = this.Utils.genID(images);
        const form = new formidable.IncomingForm();
        form.uploadDir = path;
        form.type = 'multipart';
        form.multiples = false;
        form.keepExtensions = true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        form.parse(req, async(err, fields, files) => {
            if (err) {
                console.log(`[INTERNAL ERROR] - ${err}\n${err.stack}`);
                return res.status(this.codes.internalErr).send('[ERROR] Something went wrong!');
            }

            if (!files) {
                return res.status(this.codes.badReq).send('[ERROR] NO FILES RECIEVED!');
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const image = new this.base.schemas.Image( { ID: name, owner: auth.uID, path: files.path } );
            await image.save();
            return res.status(this.codes.ok).send(`${this.base.options.url}/images/${name}`);
        } );
    }
}

export default Image;
