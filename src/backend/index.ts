import * as StartupHandler from './handlers/startup-handler';

process.on('beforeExit', (code) => {
	console.log(`Exiting with code ${code}`);
});

process.on('exit', () => {
	console.log('Exiting...');
});
void StartupHandler.startFolderr();

process.on('SIGINT', async () => {
	process.exit(0);
});

process.on('SIGTERM', async () => {
	process.exit(0);
});
