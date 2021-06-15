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
import {Request, Response} from 'express';
import pkg from '../../../package.json';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

// @ts-expect-error
momentDurationFormatSetup(moment);

/**
 * @classdesc Shows overall information
 */
class Pong extends Path {
	constructor(core: Core) {
		super(core);
		this.label = '[API] Pong';
		this.path = '/api/';
		this.type = 'get';
	}

	/**
	 * @desc PONG! Just a simple response, no auth needed
	 */
	async execute(
		request: Request,
		response: Response
	): Promise<Response | void> {
		const out: {
			message: {
				version: string;
				node_version: string;
				online_since: number;
				message: string;
			};
			code: number;
		} = {
			message: {
				version: pkg.version,
				node_version: process.version,
				online_since: new Date(Date.now() - process.uptime() * 1000).getTime(),
				message: 'Pong!'
			},
			code: this.codes.ok
		};
		return Promise.resolve(response.status(this.codes.ok).json(out));
	}
}

export default Pong;
