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

import wlogger from './WinstonLogger';

/**
 * @author VoidNulll
 *
 * @classdesc Class to handle logging certain elements, allows for sending info to Discord webhooks.
 */
class Logger {
    /**
     * @desc Log something to Discord, or try to...
     *
     * @param type {string} The type of log it is logging;
     * @param information {string} The information to send with the log
     *
     * @return {void}
     */
    log(type: string, information: string): any {
        const base = `[${type}] - ${information}`;
        if (type.startsWith('SECURITY WARN') ) {
            wlogger.log( { level: 'warn', message: base.replace(/warn/i, ''), private: true } );
        } else if (type.startsWith('SYSTEM INFO') || type.startsWith('SYSTEM NOTICE') || type === 'SYSTEM - SIGNUP') {
            wlogger.log('info', base.replace('[SYSTEM INFO] - ', '') );
        } else {
            wlogger.log('verbose', base);
        }
    }
}

export default Logger;
