/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import Path from '../../Structures/Path';
import Core from '../../Structures/Core';
import { Response } from 'express';
import { promises as fs, existsSync } from 'fs';

/**
 * @classdesc Have a user delete their file
 */
class DeleteFile extends Path {
    constructor(core: Core) {
        super(core);
        this.label = '[API] Delete Image';
        this.path = '/api/file/:id';
        this.type = 'delete';
        this.reqAuth = true;
    }

    
    // eslint-disable-next-line consistent-return
    async execute(req: any, res: any): Promise<Response | void> {
        const auth = req.cookies?.token ? await this.Utils.authorization.verifyAccount(req.cookies.token, { web: true } ) : await this.Utils.authorization.verifyAccount(req.headers.authorization);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed.' } );
        }

        if (!req.params?.id) {
            return res.status(this.codes.badReq).jsson( { code: this.codes.badReq, message: 'Missing File ID!' } );
        }

        const File = await this.core.db.findFile( { owner: auth.userID, ID: req.params.id } );
        if (!File) {
            return res.status(this.codes.notFound).json( { code: this.Utils.FoldCodes.db_not_found, message: 'File not found!' } );
        }

        await this.core.db.purgeFile( { ID: File.ID, owner: auth.userID } );
        res.status(this.codes.ok).json( { code: this.codes.ok, message: 'OK' } ).end();
        if (existsSync(File.path) ) {
            await fs.unlink(File.path);
        }
    }
}

export default DeleteFile;
