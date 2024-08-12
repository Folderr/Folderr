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

import type { Model } from "mongoose";
import { Schema, model } from "mongoose";
import type { PendingMember } from "../Structures/Database/db-class.js";

const user = new Schema({
	id: { type: String, required: true, index: true },
	password: { type: String, required: true },
	username: { type: String, required: true },
	validationToken: { type: String, required: true },
	email: { type: String, required: true },
	createdAt: { type: Date, default: new Date() },
});

const mod: Model<PendingMember> = model<PendingMember>("verifying_user", user);

export default mod;
