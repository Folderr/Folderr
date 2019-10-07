import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import formidable from 'formidable';
import { join } from 'path';
import { unlinkSync } from 'fs';

class Image extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Upload Image';
        this.path = '/api/image';
        this.type = 'post';
        this.reqAuth = true;
    }

    _formidablePromise(req: any): Promise<any> {
        return new Promise( (resolve, reject): formidable.File | void => {
            const path = join(__dirname, '../../Images/');
            const form = new formidable.IncomingForm();
            form.uploadDir = path;
            form.type = 'multipart';
            form.multiples = false;
            form.keepExtensions = true;

            form.parse(req, (err: Error, fields: any, files: any) => {
                if (err) {
                    return reject(err);
                }
                return resolve(files);
            } );
        } );
    }

    async execute(req: any, res: any): Promise<Response|void> {
        const auth = !req.cookies || !req.cookies.token || !req.cookies.token.startsWith('Bearer') ? await this.Utils.authToken(req) : await this.Utils.authBearerToken(req.cookies);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        const images = await this.base.schemas.Image.find();
        const name = this.Utils.genID(images);
        let file;
        try {
            file = await this._formidablePromise(req);
        } catch (err) {
            res.status(this.codes.internalErr).send(`[ERROR] Parser error!\n${err}`);
            throw Error(err);
        }

        if (!file) {
            return res.status(this.codes.badReq).send('[ERROR] Files not parsed/found!');
        }
        if (!file.image.type || !file.image.type.startsWith('image') ) {
            unlinkSync(file.image.path);
            return res.status(this.codes.badReq).send('[ERROR] Not an image!');
        }

        let ext = file.image.path.split('.');
        ext = ext[ext.length - 1];

        console.log(`[INFO - IMAGES] Image ${this.base.options.url}/images/${name}.${ext} added!`);

        const image = new this.base.schemas.Image( { ID: name, owner: auth.uID, path: file.image.path } );
        await image.save();
        return res.status(this.codes.ok).send(`${this.base.options.url}/images/${name}.${ext}`);
    }
}

export default Image;
