import type { Model } from "mongoose";
import { model, Schema } from "mongoose";
import type { Ban } from "../Structures/Database/db-class.js";

const userSchema = new Schema({
	id: { type: String, required: true },
	email: { type: String, required: true },
	reason: { type: String, required: true },
	createdAt: { type: Date, default: Date.now, index: true },
});

// Emails are looked up without regard to letter case, see Schemas/user.ts
userSchema.index(
	{ email: 1 },
	{ collation: { locale: "en", strength: 2 }, name: "email_ci" },
);

const mod: Model<Ban> = model<Ban>("ban", userSchema);

export default mod;
