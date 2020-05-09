import { Schema, model, Model, Document } from 'mongoose';

const User: Schema = new Schema( {
    userID: { type: String, required: true, index: true },
    password: { type: String, required: true },
    first: { type: Boolean, default: false },
    username: { type: String, required: true },
    admin: { type: Boolean, default: false },
    notifs: { type: [{ ID: { type: String }, title: { type: String }, notify: { type: String } }], required: false, default: [] },
    cURLs: { type: Array, default: [] },
    files: { type: Number, default: 0 },
    links: { type: Number, default: 0 },
    email: { type: String, required: true, index: true },
    pendingEmail: { type: String },
    pendingEmailToken: { type: String },
    created: { type: Date, default: new Date() },
} );

export interface Notification {
    ID: string;
    title: string;
    notify: string;
}

export interface UserI extends Document {
    userID: string;
    password: string;
    first?: boolean;
    username: string;
    admin?: boolean;
    notifs: Notification[];
    cURLs: string[];
    files: number;
    links: number;
    created: Date;
    email: string;
    pendingEmail?: string;
    pendingEmailToken?: string;
}

const mod: Model<UserI> = model<UserI>('user', User);

export default mod;
