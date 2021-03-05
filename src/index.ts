import * as StartupHandler from './Handlers/StartupHandler';

process.on('beforeExit', (code) => {
    console.log(`Exiting with code ${code}`)
})

process.on('exit', code => {
    console.log("Exiting...")
})
StartupHandler.startFolderr();

process.on('SIGINT', async() => {
    process.exit(0);
} );

process.on('SIGTERM', async() => {
    process.exit(0);
} );