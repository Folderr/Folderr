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

import { Schema, Model, model, Document } from 'mongoose';

export interface Link extends Document {
    link: string;
    owner: string;
    ID: string;
    created: Date;
}

const ShortSchema: Schema<Link> = new Schema( {
    link: { type: String, required: true },
    owner: { type: String, required: true },
    ID: { type: String, required: true, index: true },
    created: { type: Date, default: new Date() },
} );

const ShortModel: Model<Link> = model('short', ShortSchema);

export default ShortModel;