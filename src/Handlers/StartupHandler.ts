import Core from '../Structures/Core';

const core = new Core();

export async function startFolderr(): Promise<void> {
    await core.initDB();
    const paths = core.initPaths();
    if (!paths) {
        core.logger.error('[FATAL] Paths could not initalize');
        process.exit(1);
    }
    try {
        core.initServer();
    } catch (e) {
        core.logger.error('[FATAL] FAILED TO INITIALIZE WEB SERVER');
        core.logger.error(e);
        core.logger.debug(e.stack);
        process.exit(1);
    }
    try {
        const listened = core.listen();
        if (!listened) {
            core.logger.error('[FATAL] UNABLE TO LISTEN TO PORT');
            process.exit(1);
        } else {
            core.logger.log('ready', 'Service started and listening!');
        }
    } catch (e) {
        core.logger.error('[FATAL] UNABLE TO LISTEN TO PORT');
        core.logger.error(e);
        core.logger.debug(e.stack);
    }
}
