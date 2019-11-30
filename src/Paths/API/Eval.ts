/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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
import Evolve from '../../Structures/Evolve';
import Base from '../../Structures/Base';
import { Response } from 'express';
import { inspect } from 'util';

class Eval extends Path {
    constructor(evolve: Evolve, base: Base) {
        super(evolve, base);
        this.label = '[API] Eval';
        this.path = '/api/eval';
        this.type = 'post';
        this.reqAuth = true;
    }

    async execute(req: any, res: any): Promise<Response> {
        const auth = await this.Utils.authToken(req, (user) => !!user.first);
        if (!auth || typeof auth === 'string') {
            return res.status(this.codes.unauth).send(auth || '[ERROR] Authorization failed. Who are you?');
        }
        if (!req.body || !req.body.eval) {
            console.log(req.body);
            return res.status(this.codes.badReq).send('[ERROR] Eval code not provided.');
        }
        try {
            // eslint-disable-next-line no-eval
            let evaled = await eval(req.body.eval);
            switch (typeof evaled) {
                case 'object': {
                    evaled = inspect(evaled, { depth: 0, showHidden: true });
                    break;
                }
                default: {
                    evaled = String(evaled);
                }
            }
            if (!evaled || evaled.length === 0) {
                return res.status(this.codes.noContent).send();
            }
            if (evaled.length > 2000) {
                return res.status(this.codes.ok).send('[ERROR] Eval too big');
            }
            return res.status(this.codes.ok).send(evaled);
        } catch (err) {
            return res.status(this.codes.ok).send(`[ERROR] ${err}`);
        }
    }
}

export default Eval;
