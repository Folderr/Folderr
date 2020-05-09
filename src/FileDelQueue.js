import DBQueue from './Structures/Utilities/DBQueue';
const queuer = new DBQueue();
process.on('message', ({ msg, data }) => {
    if (msg === 'add') {
        queuer.add(data);
    }
});
