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

const AdminNotifs: Schema = new Schema({
	title: {type: String, required: true},
	notify: {type: String, required: true},
	id: {type: String, required: true, index: true},
	createdAt: {type: Date, default: new Date()}
});

export interface Notification extends Document {
	title: string;
	notify: string;
	id: string;
	createdAt: Date;
}

const mod: Model<Notification> = model<Notification>(
	'admin_notifs',
	AdminNotifs
);

export default mod;