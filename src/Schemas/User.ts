import { Schema, model, Model, Document } from 'mongoose';

const User: Schema = new Schema( {
    uID: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String, required: false },
    first: { type: Boolean, required: false },
    username: { type: String, required: true },
    admin: { type: Boolean, default: false },
    notifs: { type: [{ ID: { type: String }, title: { type: String }, notify: { type: String } }], required: false, default: [] },
} );

export interface Notification {
    ID: string;
    title: string;
    notify: string;
}

export interface UserI extends Document {
    uID: string;
    password: string;
    token: string;
    first?: boolean;
    username: string;
    admin?: boolean;
    notifs?: Notification[];
}

const mod: Model<UserI> = model<UserI>('user', User);

export default mod;