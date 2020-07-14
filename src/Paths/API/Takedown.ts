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

import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { User } from '../../Structures/Database/DBClass';

/**
 * @classdesc Admin endpoint for removing a users content
 */
class Takedown extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Takedown Content';
        this.type = 'delete';
        this.path = '/api/admin/content/:type/:id';
    }

    async takedownFile(id: string, req: Request): Promise<{ httpCode: number; msg: { code: number; message: string } }> {
        const del = await this.base.db.findAndDeleteFile( { ID: id } );
        if (!del) {
            return { httpCode: this.codes.notAccepted, msg: { code: this.Utils.FoldCodes.db_not_found, message: 'File not found!' } };
        }
        await this.base.db.updateUser( { userID: del.owner }, { $inc: { files: -1 } } );
        if (this.base.emailer.active) {
            const user = await this.base.db.findUser( { userID: del.owner }, 'userID username email');
            if (!user) {
                return { httpCode: this.codes.ok, msg: { code: this.codes.ok, message: 'OK' } };
            }
            const email = this.Utils.decrypt(user.email);
            const url = await this.Utils.determineHomeURL(req);
            await this.base.emailer.takedown(email, user.username, url, id, del.type);
        }
        return { httpCode: this.codes.ok, msg: { code: this.codes.ok, message: 'OK' } };
    }

    async takedownLink(id: string, req: Request): Promise<{ httpCode: number; msg: { code: number; message: string } }> {
        const del = await this.base.db.findAndDeleteLink( { ID: id } );
        if (!del) {
            return { httpCode: this.codes.notAccepted, msg: { code: this.Utils.FoldCodes.db_not_found, message: 'Link not found!' } };
        }
        await this.base.db.updateUser( { userID: del.owner }, { $inc: { links: -1 } } );
        if (this.base.emailer.active) {
            const user = await this.base.db.findUser( { userID: del.owner }, 'userID username email');
            if (!user) {
                return { httpCode: this.codes.ok, msg: { code: this.codes.ok, message: 'OK' } };
            }
            const email = this.Utils.decrypt(user.email);
            const url = await this.Utils.determineHomeURL(req);
            await this.base.emailer.takedown(email, user.username, url, id, 'Link');
        }
        return { httpCode: this.codes.ok, msg: { code: this.codes.ok, message: 'OK' } };
    }

    async execute(req: Request, res: Response): Promise<Response> {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed' } );
        }
        if (!req.params?.type || !req.params?.id || !['file', 'link'].includes(req.params.type) || !/^[0-9A-Za-z]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid requirements' } );
        }
        try {
            if (req.params.type === 'file') {
                const out = await this.takedownFile(req.params.id, req);
                return res.status(out.httpCode).json(out.msg);
            }
            const out = await this.takedownLink(req.params.id, req);
            return res.status(out.httpCode).json(out.msg);
        } catch (e) {
            return res.status(this.codes.internalErr).json( { code: this.Utils.FoldCodes.unknown_error, message: `An error occurred!\n${e.message || e}` } );
        }
    }
}

export default Takedown;
