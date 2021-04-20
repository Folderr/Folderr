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
import {Response} from 'express';
import {User} from '../../Structures/Database/db-class';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc Shows users to admins
 */
class Users extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Users';
		this.path = '/api/admin/users';
		this.reqAuth = true;
	}

	async execute(request: Request, response: Response): Promise<Response | void> {
		const auth = await this.Utils.authPassword(request, (user: User) => Boolean(user.admin));
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).json({code: this.codes.unauth, message: 'Authorization failed.'});
		}

		const generated = this.generatePageQuery(request, auth.userID);
		if (generated.errored) {
			const genType = generated as unknown as {
				httpCode: number;
				json: Record<string, string|number>;
				errored: boolean;
			};
			return response.status(genType.httpCode).json(genType.json);
		}

		const {query, options} = generated as unknown as {
			query: {
				$gt?: {created: Date};
				$lt?: {created: Date};
				owner: string;
			};
			options: {
				sort?: Record<string, unknown>;
				limit?: number;
			};
			errored: boolean;
		};

		const users: User[] = await this.core.db.findUsers(query, options);
		if (users.length === 0) {
			return response.status(this.codes.ok).json({code: this.Utils.FoldCodes.dbNotFound, message: []});
		}

		const array: Array<{
			title?: string | boolean;
			username: string;
			files: number;
			links: number;
			email: string;
			userID: string;
			created: number;
		}> = users.map((user: User) => {
			return {
				title: !user.admin && !user.first ? '' : (user.admin && 'admin') || (user.first && 'first'),
				username: user.username,
				files: user.files,
				links: user.links,
				email: user.email,
				userID: user.userID,
				created: Math.round(user.created.getTime() / 1000)
			};
		});
		return response.status(this.codes.ok).json({code: this.codes.ok, message: array});
	}
}

export default Users;
