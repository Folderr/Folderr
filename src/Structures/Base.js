import superagent from 'superagent';
import express from 'express';
import mongoose from 'mongoose';
import { platform } from 'os';
import events from 'events';
import User from '../Schemas/User';
import Image from '../Schemas/Image';
import Utils from './Utils';
const ee = new events();

ee.on('fail', () => {
    setTimeout(() => {
        process.exit();
    }, 1000);
} );

const optionsBase = {
    port: 8888,
    url: 'localhost',
    mongoUrl: 'mongodb://localhost/evolve-x'
};

class Base {
    /**
     * @param {Object} evolve The Evolve client
     * @param {Object} [options={}] The options for the image host
     * @param {String} [flags=''] The flags, used for the first initiation
     *
     * @prop {Object} evolve The evolve client
     * @prop {Object} superagent The superagent dependency
     * @prop {Object} _options The constructor options, deleted later
     * @prop {Object} web The express server
     * @prop {Object} schemas The schemas used by Evolve-X
     * @prop {Object} Utils the utilities for Evolve-X
     * @prop {String} flags The runtime flags for the base
     *
     * @prop {Object} options The Evolve-X options, initiated later
     * */
    constructor(evolve, options = {}, flags = '') {
        this.evolve = evolve;
        this.superagent = superagent;
        this._options = options;
        this.web = express();
        this.schemas = { User, Image };
        this.Utils = Utils;
        this.flags = flags;
    }

    async init() {
        if (this.flags !== '--init-first') {
            // If there are no paths, exit
            if (!this.evolve.paths || this.evolve.paths.size < 1) {
                console.log('No paths. Exiting...');
                process.exit();
            }
        }
        // Verify the config
        for (const key in optionsBase) {
            if (!this._options[key] ) {
                this._options[key] = optionsBase[key];
            }
            // Handle database config, hopefully this will reduce the amount of errors people get
            if (key === 'mongoUrl' && this._options[key].startsWith('mongodb://') ) {
                let mUrl = this._options[key].slice(10);
                mUrl = mUrl.split('/');
                if (!mUrl[1]) {
                    this._options[key] += '/evolve-x';
                }
            } else if (key === 'mongoUrl' && !this._options[key].startsWith('mongodb://') ) {
                const mUrl = this._options.mongoUrl.split('/');
                if (!mUrl[1]) {
                    this._options[key] = `mongodb://${this._options[key]}/evolve-x`;
                } else {
                    this._options[key] = `mongodb://${this._options[key]}`;
                }
            }
        }
        this.options = this._options;
        delete this._options;

        // Initiate the database
        mongoose.connect(this.options.mongoUrl, { useNewUrlParser: true } );

        // Make sure you do not try to listen on a port in use (also its a more helpful error message)
        if (this.flags !== '--init-first') {
            // If you are on linux and trying to listen to a port under 1024, you cannot if you are not root.
            // Handle this if you are not root
            if ((process.getuid && process.getuid() !== 0) && this.options.port < 1024 && platform() === 'linux') {
                ee.emit('fail');
                throw Error(`[FAIL] Cannot listen to port ${this.options.port} as you are not root!`);
            }

            const uhm = await this.superagent.get(`localhost:${this.options.port}`).catch( (err) => {
                if (err.message.startsWith('connect ECONNREFUSED') ) {
                    //
                } else {
                    throw Error(err);
                }
            });
            if (uhm && this.flags !== '--init-first') {
                ee.emit('fail');
                throw Error('You are trying to listen on a port in use!');
            }

            this.web.listen(this.options.port);
        }

    }
}

export default Base;
