import { Schema, model } from 'mongoose';

const User = new Schema( {
    uID: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    validationToken: { type: String, required: true },
} );

export default model('verifying_user', User);
