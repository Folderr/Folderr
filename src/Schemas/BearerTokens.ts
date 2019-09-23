import { Schema, model, Model, Document } from 'mongoose';

const week = 604800000;

const BearerToken: Schema = new Schema( {
    uID: { type: String, required: true },
    token: { type: String, required: true },
    expires: { type: Date, default: new Date(Date.now() + week) },
} );

export interface BearerTokenSchema extends Document {
    uID: string;
    token: string;
    expires: Date;
}

const mod: Model<BearerTokenSchema> = model<BearerTokenSchema>('bearer_token', BearerToken);

export default mod;
