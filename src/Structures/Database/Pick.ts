import MongooseDB from './MongooseDB';
import DBClass from './DBClass';

export function pickDB(): DBClass {
    return new MongooseDB();
}

export default pickDB();
