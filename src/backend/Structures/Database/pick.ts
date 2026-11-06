import type { DBClass } from "./db-class.js";
import Mongoosedb from "./mongoose-db.js";

export default function pickdb(): DBClass {
	return new Mongoosedb();
}
