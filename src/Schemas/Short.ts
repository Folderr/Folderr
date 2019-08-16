import { Schema, Model, model, Document } from 'mongoose';

export interface Short extends Document {
    link: string;
    owner: string;
    ID: string;
}

const ShortSchema: Schema<Short> = new Schema( {
    link: { type: String, required: true },
    owner: { type: String, required: true },
    ID: { type: String, required: true },
} );

const ShortModel: Model<Short> = model('short', ShortSchema);

export default ShortModel;
