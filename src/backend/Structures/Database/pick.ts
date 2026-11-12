import type { Config } from "../../handlers/config-handler.js";
import logger from "../logger.js";
import { DatabaseError, type DBClass } from "./db-class.js";
import Mongoosedb from "./mongoose-db.js";
import SQLiteDB from "./sqlite.js";

// SQLite is meant to be a local `file:` database. Remote libSQL servers (libsql://, http(s)://,
// ws(s)://) work too, but anything that needs a database server should use Postgres instead
const SQLITE_URL = /^(file:|libsql:\/\/|https?:\/\/|wss?:\/\/)/;
const MONGO_URL = /^mongodb(\+srv)?:\/\//;

export default function pickdb(config: Config["db"]): DBClass {
	if (SQLITE_URL.test(config.url)) {
		return new SQLiteDB();
	}

	if (MONGO_URL.test(config.url)) {
		logger.warn("MongoDB Database will be deprecated very soon");
		return new Mongoosedb();
	}

	throw new DatabaseError(
		"Your database is not supported. Use SQLite with a 'file:' URL, e.g. file:./folderr.db",
	);
}
