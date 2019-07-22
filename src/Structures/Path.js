import Base from './Base';

class Path extends Base {
    constructor(evolve, options) {
        super(evolve, options);
        this.label = 'label'; // Label for the path.
        this.path = ''; // The path to server for
        this.type = 'get'; // What type of request it needs
        // this.reqAuth = false;
    }

    // Place holder. Replace in child
    execute (req, res) {
        throw Error('Not implemented!');
    }

    _execute(req, res) {
        // If ratelimited, tell the user
        if (this.evolve.ipBans.includes(req.ip) ) {
            return res.status(403).send('Rate limited (Banned)');
        }

        let check = this.evolve.ips.get(req.ip);
        // You get three requestrs in two seconds and you get banned on the fourth.
        this.evolve.ips.set(req.ip, !isNaN(check) ? check + 1 : 0);
        if (!check && this.evolve.ips.get(req.ip) ) {
            setTimeout(() => {
                this.evolve.ips.delete(req.ip);
            }, 2000);
        }

        check = this.evolve.ips.get(req.ip);
        if (check > 3) {
            // Ban the IP if check is greater than or equal to three
            this.evolve.ipBans.push(req.ip);
            console.log(`IP ${req.ip} banned!`);
            setTimeout(() => {
                this.evolve.ipBans = this.evolve.ipBans.filter(ip => ip !== req.ip);
                console.log(this.evolve.ipBans);
            }, 3600000);
            return res.status(403).send('Rate limited (Banned)'); // Tell the user they are rate limited
        }

        // If the path does not need authentication
        if (!this.reqAuth) {
            return this.execute(req, res);
        }
        // Uh...
    }
}

export default Path;
