import type { Config } from "../../handlers/config-handler.js";
import { DatabaseError, type DBClass } from "./db-class.js";
import SQLiteDB from "./sqlite.js";

// SQLite is meant to be a local `file:` database. Remote libSQL servers (libsql://, http(s)://,
// ws(s)://) work too, but anything that needs a database server should use Postgres instead
const SQLITE_URL = /^(file:|libsql:\/\/|https?:\/\/|wss?:\/\/)/;

export default function pickdb(config: Config["db"]): DBClass {
	if (/^file::memory:/.test(config.url) && process.env.NODE_ENV !== "test") {
		throw new DatabaseError(
			"In-memory databases are only allowed in tests",
		);
	}
	if (SQLITE_URL.test(config.url)) {
		return new SQLiteDB();
	}

	throw new DatabaseError(
		"Your database is not supported. Use SQLite with a 'file:' URL, e.g. file:./folderr.db",
	);
}
