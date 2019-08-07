import Path from '../Structures/Path';

class Home extends Path {
    constructor(evolve, options) {
        super(evolve, options);
        this.label = 'Homepage';

        this.path = '/';
        this.type = 'get';
        this.enabled = !this.base.options.apiOnly;
    }

    execute(req, res) {
        return res.send('Hello World!');
    }
}

export default Home;
