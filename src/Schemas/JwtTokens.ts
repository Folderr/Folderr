import { Schema, model, Model, Document } from 'mongoose';

const JwtToken: Schema = new Schema( {
    id: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    web: { type: Boolean, required: false, default: false },
    created: { type: Date, default: new Date() },
} );

/* eslint-disable */
export interface JwtTokenI extends Document {
    id: string;
    userID: string;
    web?: boolean;
    created: Date;
}

const mod: Model<JwtTokenI> = model<JwtTokenI>('jwttoken', JwtToken);
/* eslint-enable */
export default mod;
