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
import Path from '../../Structures/path';
import Core from '../../Structures/core';
import Package from '../../../package.json';
import childProcess from 'child_process';
import util from 'util';
import {Response} from 'express';
import {Request} from '../../Structures/Interfaces/express-extended';

const exec = util.promisify(childProcess.exec);

/**
 * @classdesc System information such as branch, commit its on, and version
 */
class Info extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Info';
		this.path = '/api/info';
		this.reqAuth = true;
	}

	async execute(request: Request, response: Response): Promise<Response> {
		const auth = await this.checkAuthAdmin(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({code: this.codes.unauth, message: 'Authorization failed.'});
		}

		let branch: any = await exec('git branch');
		branch = branch.stdout;
		branch = branch.split('\n');
		for (const b of branch) {
			if (b.startsWith('*')) {
				branch = b.slice(2);
				break;
			}
		}

		let vers: any = await exec('git log -1 --oneline');
		vers = vers.stdout;

		const object = {
			commit: vers,
			branch,
			version: Package.version
		};
		return response.status(this.codes.ok).json({code: this.codes.ok, message: object});
	}
}

export default Info;
