import Path from '../Structures/Path';
import Evolve from '../Structures/Evolve';
import Base from '../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class UploadImage extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Image Upload';
        this.path = '/upload';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        if (!req.uauth) {
            return res.redirect('./');
        }
        return res.sendFile(join(__dirname, '../Frontend/upload.html') );
    }
}

export default UploadImage;
