import * as Sentry from "@sentry/node";
import process from "process"; // Shut.
import Core from "../Structures/core.js";

export async function startFolderr(): Promise<void> {
	console.time("Startup");
	const core = new Core();
	try {
		await core.initDb();
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message ===
				"Folderr DB entry not found, Folderr DB entry is required."
		) {
			core.logger.error(
				"Folderr has deemed that you have not set up this instance!",
			);
			core.logger.warn("Folderr will exit as per protocol.");
			process.exit(0);
		} else {
			Sentry.captureException(error);
		}
	}

	await core.initAuthorization();

	await core.registerServerPlugins();

	await core.testEmailer();

	// API routes under /api, pages like /f/:id and /l/:id at the site root
	await core.registerRoutes("API", "/api");
	await core.registerRoutes("Routes", "");
	core.logRouteCount();

	await core.initFrontend();

	try {
		const listened = await core.listen();
		if (listened) {
			core.postInitCleanup();
		} else {
			core.logger.error("[FATAL] UNABLE TO LISTEN TO PORT");
			throw new Error("[FATAL] UNABLE TO LISTEN TO PORT");
		}
	} catch (error: unknown) {
		core.logger.error("[FATAL] UNABLE TO LISTEN TO PORT");
		if (error instanceof Error) {
			core.logger.error(error);
			core.logger.debug(error.stack);

			Sentry.captureException(error);
		}
	}
}
