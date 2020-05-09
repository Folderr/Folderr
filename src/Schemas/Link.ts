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
