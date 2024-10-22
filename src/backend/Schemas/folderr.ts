/* eslint-disable n/prefer-global/buffer */
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

import { Schema, model } from "mongoose";
import type { Folderr } from "../Structures/Database/db-class.js";

const folderr: Schema = new Schema({
	bans: { type: Array, default: [], required: false },
	// eslint-disable-next-line @typescript-eslint/naming-convention
	publicKeyJWT: { type: Buffer, required: true },
});

export default model<Folderr>("folderr", folderr);
