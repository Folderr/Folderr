import { Response, Request } from 'express';
import Path from '../../Structures/Path';
import Base from '../../Structures/Base';
import Folderr from '../../Structures/Folderr';
import { User } from '../../Structures/Database/DBClass';

class Lookup extends Path {
    constructor(evolve: Folderr, base: Base) {
        super(evolve, base);
        this.label = '[API] Lookup Content';
        this.path = '/api/admin/content/:type/:id';
    }

    async execute(req: Request, res: Response) {
        const auth = await this.Utils.authPassword(req, (user: User) => !!user.admin);
        if (!auth) {
            return res.status(this.codes.unauth).json( { code: this.codes.unauth, message: 'Authorization failed' } );
        }
        console.log(req.params);
        if (!req.params?.type || !req.params?.id || !['file', 'link'].includes(req.params.type) || !/^[A-Za-z0-9]+$/.test(req.params.id) ) {
            return res.status(this.codes.badReq).json( { code: this.codes.badReq, message: 'Missing or invalid requirements' } );
        }
        try {
            const out = req.params.type === 'file' ? await this.base.db.findFile( { ID: req.params.id } ) : await this.base.db.findLink( { ID: req.params.id } );
            if (!out) {
                return res.status(this.codes.noContent).json( { code: this.Utils.FoldCodes.db_not_found, message: {} } );
            }
            return res.status(this.codes.ok).json( { code: this.codes.ok, message: out } );
        } catch (e) {
            return res.status(this.codes.internalErr).json( { code: this.Utils.FoldCodes.db_error, message: `An error occurred!\n${e.message || e}` } );
        }
    }
}

export default Lookup;
