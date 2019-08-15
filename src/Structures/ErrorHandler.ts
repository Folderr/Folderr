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
            this.Path.enabled = false;
        }
        return message;
    }
}

export default ErrorHandler;
