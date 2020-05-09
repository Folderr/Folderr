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

import { Schema, model, Model, Document } from 'mongoose';

const File: Schema = new Schema( {
    ID: { type: String, required: true, index: true },
    owner: { type: String, required: true },
    path: { type: String, required: true },
    type: { type: String, required: true },
    created: { type: Date, default: new Date() },
} );
/* eslint-disable */
export interface UploadI extends Document {
    ID: string;
    owner: string;
    format: string;
    path: string;
    type: string;
    created: Date;
}

const mod: Model<UploadI> = model<UploadI>('file', File);
/* eslint-enable */
export default mod;
