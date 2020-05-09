import { Schema, model, Model, Document } from 'mongoose';

const User: Schema = new Schema( {
    userID: { type: String, required: true, index: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    validationToken: { type: String, required: true },
    email: { type: String, required: true },
    created: { type: Date, default: new Date() },
} );

export interface VUser extends Document {
    userID: string;
    password: string;
    username: string;
    validationToken: string;
    email: string;
    created: Date;
}

const mod: Model<VUser> = model<VUser>('verifying_user', User);

export default mod;
