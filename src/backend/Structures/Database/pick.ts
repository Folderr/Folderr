import type { DBClass } from "./db-class.js";
import Mongoosedb from "./mongoose-db.js";

export function pickdb(): DBClass {
	return new Mongoosedb();
}
