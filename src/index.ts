/**
 * @file Initialize Folderr.
 */

import Folderr from './Structures/Folderr';
import config from '../config.json';

const folderr = new Folderr(config);

folderr.init();
