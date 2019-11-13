import { Schema, model, Model, Document } from 'mongoose';

const Image: Schema = new Schema( {
    ID: { type: String, required: true },
    owner: { type: String, required: true },
    path: { type: String, required: true },
    type: { type: String, required: false },
} );
/* eslint-disable */
export interface UploadI extends Document {
    ID: string;
    owner: string;
    format: string;
    path: string;
    type?: string;
}

const mod: Model<UploadI> = model<UploadI>('image', Image);
/* eslint-enable */
export default mod;
