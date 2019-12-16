/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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
 * @author VoidNulll
 * @version 0.8.0
 * @file Error handler for express paths, as defined in Path.ts
 */

import Path from './Path';

export interface HandlerMessage {
    culprit: string;
    file: string;
    message: string;
    severity?: string;
}

/**
 * @class ErrorHandler
 *
 * @classdesc Error handler for express paths, as defined in Path.ts
 *
 * @author Null#0515
 */
class ErrorHandler {
    private Path: Path;

    /**
     * @param {Object} path The Path to use
     */
    constructor(path: Path) {
        this.Path = path;
    }

    /**
     * @desc Handle a paths error when it arises
     *
     * @param {Object} err The error object
     * @param {String} [severity] String on how severe the error is
     * @returns {{severity: String, culprit: String, file: String, message: String}}
     */
    handlePathError(err: Error, severity?: string): HandlerMessage {
        if (!err || !err.stack) {
            throw Error('[ERROR] - Missing error (REQUIRED)');
        }
        // Define variables
        const base = err.stack.split('\n');
        const cul: string = base[2].slice(7);
        const file = cul;
        const culprit: string = cul.split(' ')[0];
        const message: HandlerMessage = { culprit, file: file.slice(culprit.length + 1), message: base[0], severity };

        // Disable path if the error was fatal
        if (severity && severity === 'fatal') {
            this.Path.locked = true;
        }
        return message;
    }
}

export default ErrorHandler;
