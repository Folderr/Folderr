import codes from './Status_Codes';
import ErrorHandler from "./ErrorHandler";

const severities = {
    '[FATAL]': 'fatal',
    '[MEDIUM]': 'medium',
    '[LOW]': 'low'
};

class Path {
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
        if (!this.enabled && !path.lean) {
            return res.status(this.codes.locked).send('[FATAL] Endpoint locked due to fatal errors!');
        }
        const twoSec = 2000;
        const maxTrys = 3;
        const hour = 3600000;
        // If ratelimited, tell the user
        if (this.evolve.ipBans.includes(req.ip) ) {
            return res.status(this.codes.foribidden).send('Rate limited (Banned)');
        }

        let check = this.evolve.ips.get(req.ip);
        // You get three requestrs in two seconds and you get banned on the fourth.
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
            if (err.message && !err.message.startsWith('[ERROR]') ) {
                if (this._fatalErrors > 2) {
                    severity = 'fatal';
                } else {
                    this._fatalErrors++;
                }
            }
            const handled = err.eHandler.handlePathError(err, severity);
            console.log(`[ERROR] [PATH ${this.label}] ${handled.message} \n  Culprit: ${handled.culprit}\n  File: ${handled.file}\n  Severity: ${handled.severity}`);
            return res.status(this.codes.internal_err).send(err.stack);
        }
    }
}

export default Path;
