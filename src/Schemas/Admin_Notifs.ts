import {Schema, model, Model, Document} from 'mongoose';

const AdminNotifs: Schema = new Schema( {
    title: { type: String, required: true },
    notify: { type: String, required: true },
    ID: { type: String, required: true },
} );

interface iAdminNotifs extends Document {
    title: string;
    notify: string;
    ID: string;
}

const mod: Model<iAdminNotifs> = model<iAdminNotifs>('admin_notifs', AdminNotifs);

export default mod;
