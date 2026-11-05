import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle/sqlite",
	schema: "./src/backend/Structures/Database/Schemas/SQLite/sqlite.ts",
	dialect: "sqlite",
});
