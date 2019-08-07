import codes from './Status_Codes';
import ErrorHandler from "./ErrorHandler";

const severities = {
    '[FATAL]': 'fatal',
    '[MEDIUM]': 'medium',
    '[LOW]': 'low'
};

class Path {
    /**
     *
     * @param evolve The Evolve-X client
     * @param base The base of the system
     *
     * @prop {String} label The label for this path to be called
     * @prop {String} path The path that this path will fall under in the website/api
     * @prop {String} type=get The HTTP method this request will use
     * @prop {Boolean} enabled=true Whether or not to enable this endpoint.. Also helps handle errors
     * @prop {Boolean} lean=false Whether or not to ignore fatal (uncaught) errors in the long run
     *
     * @prop {Object} codes The http status codes Evolve-X uses
     * @prop {Object} evolve The evolve-x client, at your disposal
     * @prop {Object} base The base of evolve-x (where useful stuff like schemas are held) at your disposal.
     * @prop {Object} Utils The evolve-x utilities
     *
     * @prop {Object} eHandler The error handler for this path.
     * @prop {Number} _fatalErrors=0 Private. The amount of fatal errors this path has encountered.
     */
    constructor(evolve, base) {
        this.label = 'label'; // Label for the path.
        this.path = ''; // The path to server for
        this.type = 'get'; // What type of request it needs
        this.enabled = true;
        this.lean = false;


        this.codes = codes;
        this.evolve = evolve;
        this.base = base;
        this.Utils = this.base.Utils;

        this.eHandler = new ErrorHandler(this);
        this._fatalErrors = 0;
    }

    toString() {
        return `[Path ${this.path}]`;
    }

    // Place holder. Replace in child
    // eslint-disable-next-line no-unused-vars
    execute(req, res) {
        throw Error('Not implemented!');
    }

    _execute(req, res) {
        if (!this.enabled && !this.lean) {
            return res.status(this.codes.locked).send('[FATAL] Endpoint locked due to fatal errors!');
        }
        const twoSec = 2000;
        const maxTrys = 3;
        const hour = 3600000;
        // If ratelimited, tell the user
        if (this.evolve.ipBans.includes(req.ip) ) {
            return res.status(this.codes.forbidden).send('Rate limited (Banned)');
        }

        let check = this.evolve.ips.get(req.ip);
        // You get three requesters in two seconds and you get banned on the fourth.
        this.evolve.ips.set(req.ip, !isNaN(check) ? check + 1 : 0);
        if (!check && this.evolve.ips.get(req.ip) ) {
            setTimeout( () => {
                this.evolve.ips.delete(req.ip);
            }, twoSec);
        }

        check = this.evolve.ips.get(req.ip);
        if (check > maxTrys) {
            // Ban the IP if check is greater than or equal to three
            this.evolve.ipBans.push(req.ip);
            console.log(`IP ${req.ip} banned!`);

            setTimeout( () => {
                this.evolve.ipBans = this.evolve.ipBans.filter(ip => ip !== req.ip);
                console.log(this.evolve.ipBans);
            }, hour);
            return res.status(this.codes.forbidden).send('Rate limited (Banned)'); // Tell the user they are rate limited
        }

        try {
            return this.execute(req, res);
        } catch (err) {
            let severity;
            let e = err.message;
            if (!e.startsWith('[ERROR]') ) {
                if (this._fatalErrors > 2) {
                    severity = 'fatal';
                } else {
                    this._fatalErrors++;
                    severity = '[fatal]';
                }
            }
            const handled = this.eHandler.handlePathError(err, severity);
            console.log(`[INTERNAL ERROR] [PATH ${this.label}] ${handled.message} \n  Culprit: ${handled.culprit}\n  File: (file://${handled.file.slice(1)}\n  Severity: ${handled.severity}`);
            return res.status(this.codes.internal_err).send(err.stack);
        }
    }
}

export default Path;
