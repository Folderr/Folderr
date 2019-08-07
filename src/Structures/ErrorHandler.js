class ErrorHandler {
    constructor(Path) {
        this.Path = Path;
    }

    /**
     *
     * @param {Object} err The error object
     * @param {String} [severity] String on how severe the error is
     * @returns {{severity: String, culprit: String, file: String, message: String}}
     */
    handlePathError(err, severity) {
        let base = err.stack.split('\n');
        let culprit = base[2].slice(7);
        const file = culprit;
        culprit = culprit.split(' ')[0];
        const message = { culprit, file: file.slice(culprit.length + 1), message: base[0], severity };

        if (severity && severity === 'fatal') {
            this.Path.enabled = false;
        }
        return message;
    }
}

export default ErrorHandler;
