import type { Model } from "mongoose";
import { Schema, model } from "mongoose";
import type { Ban } from "../Structures/Database/db-class";

const userSchema = new Schema({
	id: { type: String, required: true },
	email: { type: String, required: true, index: true },
	reason: { type: String, required: true },
	createdAt: { type: Date, default: new Date(), index: true },
});

const mod: Model<Ban> = model<Ban>("ban", userSchema);

export default mod;
