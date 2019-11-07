/**
 * @author VoidNulll
 * @file Initialize Evolve-X file.
 */

import Evolve from './Structures/Evolve';
import config from '../config.json';

const evolve = new Evolve(config);

evolve.init();
