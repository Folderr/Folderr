import process from 'process'; // Shut.
import * as Sentry from '@sentry/node';
import Core from '../Structures/core';

export async function startFolderr(): Promise<void> {
	// Console.time('Startup');
	const core = new Core();
	try {
		await core.initDb();
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message ===
				'Folderr DB entry not found, Folderr DB entry is required.'
		) {
			core.logger.error(
				'Folderr has deemed that you have not set up this instance!',
			);
			core.logger.warn('Folderr will exit as per protocol.');
			process.exit(0);
		} else {
			Sentry.captureException(error);
		}
	}

	await core.initAuthorization();

	await core.registerServerPlugins();

	const paths = core.initPaths();
	if (!paths) {
		core.logger.error('[FATAL] Paths could not initalize');
		throw new Error('[FATAL] Paths could not initalize');
	}

	// Init new APIs before anything else.
	await core.registerNewApi();

	// Await core.registerApis();
	await core.initAPI();

	await core.initFrontend();

	try {
		const listened = await core.listen();
		if (listened) {
			// Console.timeEnd('Startup');
		} else {
			core.logger.error('[FATAL] UNABLE TO LISTEN TO PORT');
			throw new Error('[FATAL] UNABLE TO LISTEN TO PORT');
		}
	} catch (error: unknown) {
		core.logger.error('[FATAL] UNABLE TO LISTEN TO PORT');
		if (error instanceof Error) {
			core.logger.error(error);
			core.logger.debug(error.stack);

			Sentry.captureException(error);
		}
	}
}
