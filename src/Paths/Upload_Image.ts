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
        if (req.cookies) {
            const auth = await this.Utils.authBearerToken(req.cookies);
            if (!auth || typeof auth === 'string') {
                return res.redirect('./logout');
            }
        }
        if (!req.cookies || !req.cookies.token) {
            return res.redirect('./');
        }
        return res.sendFile(join(__dirname, '../Frontend/HTML/Upload_Image.html') );
    }
}

export default UploadImage;