import { Schema, model } from 'mongoose';

const AdminNotifs = new Schema( {
    title: { type: String, required: true },
    notify: { type: String, required: true },
    ID: { type: String, required: true },
} );

export default model('admin_notifs', AdminNotifs);
