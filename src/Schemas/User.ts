import {Schema, model, Model, Document} from 'mongoose';

const User: Schema = new Schema( {
    uID: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String, required: false },
    first: { type: Boolean, required: false },
    username: { type: String, required: true },
    admin: { type: Boolean, default: false },
    notifs: { type: [{ ID: { type: String }, title: { type: String }, notify: { type: String } }], required: false, default: [] },
} );

interface notification {
    ID: string;
    title: string;
    notify: string;
}

interface IUser extends Document {
    uID: string;
    password: string;
    token: string;
    first?: boolean;
    username: string;
    admin?: boolean;
    notifs?: notification[];
}

const mod: Model<IUser> = model<IUser>('user', User);

export default mod
