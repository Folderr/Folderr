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

import {Path} from '../internals';

export interface HandlerMessage {
	culprit: string;
	file: string;
	message: string;
	severity?: string;
}

/**
 * @classdesc Error handler for Folderr paths.
 *
 * @author VoidNulll
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
	 * @param {Object} error The error object
	 * @param {String} [severity] String on how severe the error is
	 * @returns {{severity: String, culprit: String, file: String, message: String}}
	 */
	handlePathError(error: Error, severity?: string): HandlerMessage {
		if (!error || !error.stack) {
			throw new Error('[ERROR] - Missing error (REQUIRED)');
		}

		// Define variables
		const base = error.stack.split('\n');
		const cul: string = base[2].slice(7);
		const file = cul;
		const culprit: string = cul.split(' ')[0];
		const message: HandlerMessage = {
			culprit,
			file: file.slice(culprit.length + 1),
			message: base[0],
			severity
		};

		// Disable path if the error was fatal
		if (severity && severity === 'fatal') {
			this.Path.locked = true;
		}

		return message;
	}
}

export default ErrorHandler;
