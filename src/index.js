import Evolve from './Structures/Evolve';
const config = require('../config');

const evolve = new Evolve(config);

evolve.init();

/* process.on('unhandledRejection', (err) => {
   if (err.message.startsWith('[FAIL] Cannot listen to port') ) {
       console.log(err.message);
       console.log('Exiting...');
       process.exit();
   }
   else {
       throw Error(err.message || err);
   }
}); */
