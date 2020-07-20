/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
  * @fileoverview Handle the database file deletion queue
  */

import DBQueue from './Structures/Utilities/DBQueue';

const queuer = new DBQueue();

process.on('message', ( { msg, data } ) => {
    if (msg === 'add') {
        queuer.add(data);
    } else if (msg === 'check') {
        if (process.send) {
            process.send( { msg: { onGoing: queuer.onGoing } } );
        }
    } else if (msg === 'shutdown') {
        queuer.on('shutdown', () => {
            if (process.send) {
                process.send( { msg: { shutdown: true } } );
            }
        } );
    }
} );
