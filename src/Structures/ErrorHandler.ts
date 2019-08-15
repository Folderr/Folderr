import Path from './Path';

interface handlerMessage {
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
     * @param {Object} Path The Path to use
     */
    constructor(Path: Path) {
        this.Path = Path;
    }

    /**
     *
     * @param {Object} err The error object
     * @param {String} [severity] String on how severe the error is
     * @returns {{severity: String, culprit: String, file: String, message: String}}
     */
    handlePathError(err: Error, severity?: string): handlerMessage {
        if (!err || !err.stack) {
            throw Error('[ERROR] - Missing error (REQUIRED)');
        }
        // Define variables
        let base = err.stack.split('\n');
        const cul: string = base[2].slice(7);
        const file = cul;
        const culprit: string = cul.split(' ')[0];
        const message: handlerMessage = { culprit, file: file.slice(culprit.length + 1), message: base[0], severity };

        // Disable path if the error was fatal
        if (severity && severity === 'fatal') {
            this.Path.enabled = false;
        }
        return message;
    }
}

export default ErrorHandler;
