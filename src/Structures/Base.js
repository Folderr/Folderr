import superagent from 'superagent';
import express from 'express';
import mongoose from 'mongoose';
import { platform } from 'os';
import Events from 'events';
import User from '../Schemas/User';
import Image from '../Schemas/Image';
import VerifyingUser from '../Schemas/VerifyingUser';
import AdminNotifs from '../Schemas/Admin_Notifs';
import Utils from './Utils';
const ee = new Events();
const bodyParser = require('body-parser');

ee.on('fail', () => {
    setTimeout( () => {
        process.exit();
    }, 1000);
} );

const optionsBase = {
    port: 8888,
    url: 'localhost',
    mongoUrl: 'mongodb://localhost/evolve-x',
    signups: true,
    apiOnly: false,
};

const web = express();

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
        this.web = web;
        this.web.use(bodyParser.json() );
        this.schemas = { User, Image, VerifyingUser, AdminNotifs };
        this.Utils = new Utils();
        this.flags = flags;
        this.signups = this._fetchAuthType(options);
        this.options = this._initConfig(options);
    }

    _fetchAuthType(options) {
        if (!options) return true;
        if (!options.signups) return true;
        if (![true, false].includes(options.signups) ) return true;
        return options.signups;
    }

    _initConfig(options) {
        if (!options) return;
        for (const key in optionsBase) {
            if (!options[key] ) {
                options[key] = optionsBase[key];
            }
            // Handle database config, hopefully this will reduce the amount of errors people get
            if (key === 'mongoUrl' && options[key].startsWith('mongodb://') ) {
                let mUrl = options[key].slice(10);
                mUrl = mUrl.split('/');
                if (!mUrl[1] ) {
                    options[key] += '/evolve-x';
                }
            } else if (key === 'mongoUrl' && !options[key].startsWith('mongodb://') ) {
                const mUrl = options.mongoUrl.split('/');
                if (!mUrl[1] ) {
                    options[key] = `mongodb://${options[key]}/evolve-x`;
                } else {
                    options[key] = `mongodb://${options[key]}`;
                }
            }
        }
        return options;
    }

    async init() {
        if (this.flags !== '--init-first') {
            // If there are no paths, exit
            if (!this.evolve.paths || this.evolve.paths.size < 1) {
                console.log('No paths. Exiting...');
                process.exit();
            }
        }

        // Initiate the database
        mongoose.connect(this.options.mongoUrl, { useNewUrlParser: true, useFindAndModify: false } );

        // Make sure you do not try to listen on a port in use (also its a more helpful error message)
        if (this.flags !== '--init-first') {
            // If you are on linux and trying to listen to a port under 1024, you cannot if you are not root.
            // Handle this if you are not root
            const linuxRootPorts = 1024;
            const linuxRootUid = 0;
            if ( (process.getuid && process.getuid() !== linuxRootUid) && this.options.port < linuxRootPorts && platform() === 'linux') {
                ee.emit('fail');
                throw Error(`[FAIL] Cannot listen to port ${this.options.port} as you are not root!`);
            }
            // Please dont run apps as root on linux..
            if (process.getuid && process.getuid() === linuxRootUid) {
                console.log('[WARN] It is advised to not run apps as root, I would prefer if you ran me through a proxy like Nginx!"');
            }

            const uhm = await this.superagent.get(`localhost:${this.options.port}`).catch( (err) => {
                if (err.message.startsWith('connect ECONNREFUSED') ) {
                    //
                } else {
                    throw Error(err);
                }
            } );
            if (uhm && this.flags !== '--init-first') {
                ee.emit('fail');
                throw Error('You are trying to listen on a port in use!');
            }

            this.web.listen(this.options.port);
            console.log(`[INFO] Signups are: ${!this.signups ? 'disabled' : 'enabled'}`);
        }
    }
}

export default Base;
