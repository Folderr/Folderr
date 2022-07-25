import Mongoosedb from './mongoose-db';
import {DBClass} from './db-class';

export function pickdb(): DBClass {
	return new Mongoosedb();
}
