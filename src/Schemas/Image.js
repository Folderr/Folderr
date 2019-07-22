import { Schema, model } from 'mongoose';

const Image = new Schema( {
    id: { type: String, required: true },
    owner: { type: String, required: true },
    format: { type: String, required: true, default: 'png' }
} );

export default model(Image);
