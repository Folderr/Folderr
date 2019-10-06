import Path from '../../Structures/Path';
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { join } from 'path';

class Users extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = 'Users';
        this.path = '/admin/users';
        this.enabled = !this.base.options.apiOnly;
    }

    async execute(req: any, res: any): Promise<Response | void> {
        return res.sendFile(join(__dirname, '../../Frontend/HTML/Users.html') );
    }
}

export default Users;
