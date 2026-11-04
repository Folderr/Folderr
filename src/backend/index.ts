import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import process, { env } from "process";
import { type Config, loadConfig } from "./handlers/config-handler.js";
import * as StartupHandler from "./handlers/startup-handler.js";

// Sentry starts before everything else, so it can see startup errors. If the config is invalid,
// Sentry just stays off: Core loads the config again and reports the problem properly
let sentry: Config["server"]["sentry"];
try {
	sentry = loadConfig().server.sentry;
} catch {
	sentry = undefined;
}

// Tracing is on unless the config turns it off
const tracing = sentry?.tracing ?? true;

const integrations: any[] = [
	new RewriteFrames({ root: process.cwd() }),
] as any[];

if (tracing) {
	integrations.push(
		new Sentry.Integrations.Http({ tracing: true }),
		new Tracing.Integrations.Mongo({ useMongoose: true }),
	);
}

if (sentry) {
	if (env.NODE_ENV === "debug") {
		console.log("[DEBUG]: Sentry Initialized");
	}

	Sentry.init({
		dsn: sentry.dsn,

		// 1 will capture all transactions. loadConfig fills in 1 in dev and 0.2 otherwise
		tracesSampleRate: sentry.rate,
		integrations,
		environment: env.NODE_ENV === "dev" ? "development" : "production",
		debug: env.DEBUG ? Boolean(env.DEBUG) : false,
	});
}

process.on("beforeExit", (code) => {
	console.log(`Exiting with code ${code}`);
});

process.on("exit", (code) => {
	console.log(`Exiting with code ${code}`);
	console.log("(Index) Exiting...");
});
void StartupHandler.startFolderr();

process.on("SIGINT", async () => {
	process.exit(0);
});

process.on("SIGTERM", async () => {
	process.exit(0);
});
