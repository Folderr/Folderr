class ErrorHandler {
    constructor(Path) {
        this.Path = Path;
    }

    handlePathError(err, severity) {
        let base = err.stack.split('\n');
        let culprit = base[1].slice(7);
        const file = e;
        culprit = culprit.split(' ')[0];
        const message = { culprit, file: file.slice(culprit.length + 1), message: base[0], severity };

        if (severity && severity === 'fatal') {
            this.Path.enabled = false;
        }
        return message;
    }
}

export default  ErrorHandler;
