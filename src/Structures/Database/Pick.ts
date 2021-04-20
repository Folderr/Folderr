import MongooseDB from './mongoose-db';
import {DBClass} from './db-class';

export function pickDB(): DBClass {
	return new MongooseDB();
}
