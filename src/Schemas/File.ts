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
