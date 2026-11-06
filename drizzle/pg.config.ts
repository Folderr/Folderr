import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle/postgresql",
	schema: "./src/backend/Structures/Database/Schemas/postgres/postgres.ts",
	dialect: "postgresql",
});
