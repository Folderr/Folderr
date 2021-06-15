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

const User: Schema = new Schema({
	id: {type: String, required: true, index: true},
	password: {type: String, required: true},
	username: {type: String, required: true},
	validationToken: {type: String, required: true},
	email: {type: String, required: true},
	created: {type: Date, default: new Date()}
});

export interface VUser extends Document {
	id: string;
	password: string;
	username: string;
	validationToken: string;
	email: string;
	created: Date;
}

const mod: Model<VUser> = model<VUser>('verifying_user', User);

export default mod;
