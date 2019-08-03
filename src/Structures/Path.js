import codes from './Status_Codes';

class Path {
    constructor(evolve, base) {
        this.label = 'label'; // Label for the path.
        this.path = ''; // The path to server for
        this.type = 'get'; // What type of request it needs
        // this.reqAuth = false;
        this.evolve = evolve;
        this.base = base;
        this.Utils = this.base.Utils;
        this.load = true;
        this.codes = codes;
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

        return this.execute(req, res);
    }
}

export default Path;
