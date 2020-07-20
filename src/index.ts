/**
 * @file Initialize Folderr.
 */

import Folderr from './Structures/Folderr';
import config from '../config.json';

const folderr = new Folderr(config);

folderr.init();

process.on('SIGINT', async() => {
    await folderr.base.shutdown();
    process.exit(0);
} );

process.on('SIGTERM', async() => {
    await folderr.base.shutdown();
    process.exit(0);
} );
