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

import {Schema, model, Model, Document} from 'mongoose';
import { Notification } from '../Structures/Database/db-class';

const User: Schema = new Schema({
	id: {type: String, required: true, index: true},
	password: {type: String, required: true},
	first: {type: Boolean, default: false},
	username: {type: String, required: true},
	admin: {type: Boolean, default: false},
	notifs: {
		type: [
			{
				id: {type: String},
				title: {type: String},
				notify: {type: String},
				created: {type: Date, default: new Date()}
			}
		],
		required: false,
		default: []
	},
	cURLs: {type: Array, default: []},
	files: {type: Number, default: 0},
	links: {type: Number, default: 0},
	email: {type: String, required: true, index: true},
	pendingEmail: {type: String},
	pendingEmailToken: {type: String},
	created: {type: Date, default: new Date()}
});

export interface UserI extends Document {
	id: string;
	password: string;
	first?: boolean;
	username: string;
	admin?: boolean;
	notifs: Notification[];
	cURLs: string[];
	files: number;
	links: number;
	created: Date;
	email: string;
	pendingEmail?: string;
	pendingEmailToken?: string;
}

const mod: Model<UserI> = model<UserI>('user', User);

export default mod;
