import {Schema, model, Model, Document} from 'mongoose';

const User: Schema = new Schema( {
    uID: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    validationToken: { type: String, required: true },
} );

interface IUser extends Document {
    uID: string;
    password: string;
    username: string;
    validationToken: string;
}

const mod: Model<IUser> = model<IUser>('verifying_user', User);

export default mod;
