import { Schema, model } from 'mongoose';

const User = new Schema( {
    uID: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String, required: false },
    first: { type: Boolean, required: false },
    username: { type: String, required: true },
    admin: { type: Boolean, default: false },
    notifs: { type: [{ ID: { type: String }, title: { type: String }, notify: { type: String } }], required: false, default: [] },
} );

export default model('user', User);
