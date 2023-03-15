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

import {Schema, model} from 'mongoose';
import type {Tokendb} from '../Structures/Database/db-class';

const jwtToken = new Schema({
	id: {type: String, required: true, index: true},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	userID: {type: String, required: true, index: true},
	web: {type: Boolean, required: false, default: false},
	createdAt: {type: Date, default: new Date()},
	expireAt: {type: Date},
	description: {type: String, default: 'No description'},
});

jwtToken.index({expireAt: 1}, {expireAfterSeconds: 0});

const mod = model<Tokendb>('token', jwtToken);
export default mod;
