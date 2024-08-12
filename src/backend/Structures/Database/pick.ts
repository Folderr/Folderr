import Mongoosedb from "./mongoose-db.js";
import { DBClass } from "./db-class.js";

export function pickdb(): DBClass {
	return new Mongoosedb();
}
