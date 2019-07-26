import { Schema, model } from 'mongoose';

const User = new Schema( {
    uID: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String, required: true },
    first: { type: Boolean, required: false },
    username: { type: String, required: true },
    admin: { type: Boolean, default: false }
} );

export default model('user', User);
