import {Schema, model, Model, Document} from 'mongoose';

const Image: Schema = new Schema( {
    id: { type: String, required: true },
    owner: { type: String, required: true },
    format: { type: String, required: true, default: 'png' },
} );

interface IImage extends Document {
    id: string;
    owner: string;
    format: string;
}

const mod: Model<IImage> = model<IImage>('image', Image);

export default mod;
