import type { Model } from "mongoose";
import { model, Schema } from "mongoose";
import type { Ban } from "../Structures/Database/db-class.js";

const userSchema = new Schema({
	id: { type: String, required: true },
	email: { type: String, required: true, index: true },
	reason: { type: String, required: true },
	createdAt: { type: Date, default: Date.now, index: true },
});

const mod: Model<Ban> = model<Ban>("ban", userSchema);

export default mod;
