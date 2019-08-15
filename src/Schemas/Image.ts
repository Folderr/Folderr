import { Schema, model, Model, Document } from 'mongoose';

const Image: Schema = new Schema( {
    id: { type: String, required: true },
    owner: { type: String, required: true },
    format: { type: String, required: true, default: 'png' },
} );
/* eslint-disable */
export interface ImageI extends Document {
    id: string;
    owner: string;
    format: string;
}

const mod: Model<ImageI> = model<ImageI>('image', Image);
/* eslint-enable */
export default mod;
