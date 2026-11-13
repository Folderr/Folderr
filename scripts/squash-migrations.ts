/**
 * Squashes every migration added since the last release into one.
 *
 * Migrations in the last release tag are released: they never change. Anything added since is
 * unreleased work in progress, so this deletes those folders and generates one migration that
 * covers the whole change instead. Run it before a release, then delete your dev database and
 * restart to check the new migration applies cleanly.
 *
 * Usage: npm run migrations:squash:sqlite -- [name]
 *        npm run migrations:squash:pg -- [name]
 *
 * Hand-written SQL in an unreleased migration (data backfills, `--custom`) is regenerated away,
 * so add those as their own migration after squashing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const DIALECTS = {
	sqlite: { dir: "drizzle/sqlite", config: "drizzle/sqlite.config.ts" },
	pg: { dir: "drizzle/postgresql", config: "drizzle/pg.config.ts" },
} as const;

function git(...args: string[]): string {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** The migration folders in the last release tag, or none if the folder didn't exist yet */
function releasedMigrations(tag: string, dir: string): Set<string> {
	try {
		const names = git("ls-tree", "--name-only", `${tag}:${dir}`);
		return new Set(names.split("\n").filter(Boolean));
	} catch {
		// The tag predates this folder, so nothing in it has been released
		return new Set();
	}
}

const [dialect, name = "release"] = process.argv.slice(2);
if (!(dialect in DIALECTS)) {
	console.error(
		`Unknown dialect "${dialect}", expected one of: ${Object.keys(DIALECTS).join(", ")}`,
	);
	process.exit(1);
}

const { dir, config } = DIALECTS[dialect as keyof typeof DIALECTS];
const tag = git("describe", "--tags", "--abbrev=0");
const released = releasedMigrations(tag, dir);
const unreleased = existsSync(dir)
	? readdirSync(dir).filter(
			(entry) =>
				!released.has(entry) &&
				statSync(join(dir, entry)).isDirectory(),
		)
	: [];

if (unreleased.length <= 1) {
	console.log(
		`Nothing to squash: ${unreleased.length} unreleased migration(s) since ${tag}`,
	);
	process.exit(0);
}

for (const entry of unreleased) {
	rmSync(join(dir, entry), { recursive: true });
}
console.log(
	`Removed ${unreleased.length} unreleased migrations since ${tag}:\n  ${unreleased.join("\n  ")}`,
);

execFileSync(
	"npx",
	["drizzle-kit", "generate", "--config", config, "--name", name],
	{ stdio: "inherit", shell: true },
);
