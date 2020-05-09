import { Schema, model, Document } from 'mongoose';

export interface FolderrDB extends Document {
    bans: string[];
}

const Folderr: Schema = new Schema( {
    bans: { type: Array, default: [], required: false },
} );

export default model<FolderrDB>('folderr', Folderr);
