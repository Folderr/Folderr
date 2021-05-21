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
import {Notification} from '../../Structures/Database/db-class';
import {Request} from '../../Structures/Interfaces/express-extended';

/**
 * @classdesc View the authorized users account
 */
class Account extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] View Account';
		this.path = '/api/account';
		this.reqAuth = true;

		this.type = 'get';
	}

	async execute(request: Request, response: Response): Promise<Response> {
		// Check headers, and check auth
		const auth = request.cookies?.token ?
			await this.Utils.authorization.verifyAccount(
				request.cookies.token as string | string[] | undefined,
				{web: true}) :
			await this.Utils.authPassword(request);
		if (!auth || typeof auth === 'string') {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: 'Authorization failed.'
			});
		}

		// Return a nice version of this users account.
		const acc: {
			username: string;
			userID: string;
			admin: boolean;
			owner: boolean;
			files: number;
			links: number;
			customUrls?: string[];
			email: string;
			pendingEmail?: string;
			notifications: Notification[];
			created: number;
		} = {
			username: auth.username,
			userID: auth.userID,
			admin: Boolean(auth.admin),
			owner: Boolean(auth.first),
			files: auth.files,
			links: auth.links,
			email: auth.email,
			pendingEmail: auth.pendingEmail,
			notifications: auth.notifs,
			customUrls: auth.cURLs,
			created: Math.round(auth.created.getTime() / 1000)
		};
		return response.status(this.codes.ok).json({message: acc, code: this.codes.ok});
	}
}

export default Account;
