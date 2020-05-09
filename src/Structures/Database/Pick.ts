import MongooseDB from './MongooseDB';

export function pickDB() {
    return new MongooseDB();
}

export default pickDB();
