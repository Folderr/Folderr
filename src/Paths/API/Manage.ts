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
import {Response, Request} from 'express';
import childProcess from 'child_process';
import util from 'util';
import {join} from 'path';
const exec = util.promisify(childProcess.exec);
import {promises} from 'fs';

const sleep = async (ms: number): Promise<void> => {
	setTimeout(async () => Promise.resolve(), ms);
};

/**
 * @classdesc Allows the owner to manage the instance
 */
class Manage extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Manage';
		this.path = '/api/manage';

		this.type = 'post';
		this.reqAuth = true;
	}

	async execute(request: Request, response: Response): Promise<Response | void> {
		const auth = await this.Utils.authPassword(request, user => Boolean(user.first));
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).json({code: this.codes.unauth, message: 'Authorization failed.'});
		}

		if (!request.query || !request.query.type) {
			return response.status(this.codes.badReq).json({code: this.codes.badReq, message: 'Missing manage type'});
		}

		if (request.query.type === 'shutdown') {
			response.status(this.codes.ok).json({code: this.codes.ok, message: 'OK'});
			this.core.logger.info(`System shutdown initiated remotely by owner (${auth.username} - ${auth.userID})`);
			this.core.shutdownServer();
		} else if (request.query.type === 'update') {
			response.status(this.codes.accepted).json({code: this.codes.ok, message: 'Attempting update.'}).end();
			const oPackage: Record<string, string> = JSON.parse((await promises.readFile('./package.json')).toString());
			try {
				await exec('npm run update'); // Eventually make file to handle this
			} catch (error: unknown) {
				if (error instanceof Error) {
					this._handleError(error, response, undefined, {noIncrease: true, noResponse: true});
				}

				return;
			}

			const f = await promises.readFile('./package.json');
			const af: Record<string, string> = JSON.parse(f.toString());
			let v;
			const vers = {
				af: Number(af.version.split('.').join(' ')),
				old: Number(oPackage.version.split('.').join(' '))
			};
			if (vers.af > vers.old) {
				v = `Version upgraded from ${oPackage.version} to ${af.version}`;
			} else if (vers.af === vers.old) {
				v = 'Version not changed';
			} else {
				v = `Version downgraded from ${oPackage.version} to ${af.version}`;
			}

			this.core.logger.info(`System updated. ${v}`);
			return Promise.resolve();
		}

		return response.status(this.codes.badReq).json({code: this.codes.badReq, message: 'Not an option!'});
	}
}

export default Manage;
