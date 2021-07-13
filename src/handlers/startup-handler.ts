import Core from '../Structures/core';

const core = new Core();

export async function startFolderr(): Promise<void> {
	try {
		await core.initDB();
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message ===
				'Folderr DB entry not found, Folderr DB entry is required.'
		) {
			core.logger.error(
				'Folderr has deemed that you have not set up this instance!'
			);
			core.logger.notice('Folderr will exit as per protocol.');
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit(0);
		}
	}

	const paths = core.initPaths();
	if (!paths) {
		core.logger.error('[FATAL] Paths could not initalize');
		throw new Error('[FATAL] Paths could not initalize');
	}

	await core.initAuthorization();

	try {
		core.initServer();
	} catch (error: unknown) {
		core.logger.error('[FATAL] FAILED TO INITIALIZE WEB SERVER');
		if (error instanceof Error) {
			core.logger.error(error);
			core.logger.debug(error.stack);
		}

		throw new Error('[FATAL] FAILED TO INITIALIZE WEB SERVER');
	}

	try {
		const listened = core.listen();
		if (listened) {
			core.logger.log('ready', 'Service started and listening!');
		} else {
			core.logger.error('[FATAL] UNABLE TO LISTEN TO PORT');
			throw new Error('[FATAL] UNABLE TO LISTEN TO PORT');
		}
	} catch (error: unknown) {
		core.logger.error('[FATAL] UNABLE TO LISTEN TO PORT');
		if (error instanceof Error) {
			core.logger.error(error);
			core.logger.debug(error.stack);
		}
	}
}
