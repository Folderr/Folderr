import superagent, { SuperAgent, SuperAgentRequest } from 'superagent';
import express from 'express';
import mongoose from 'mongoose';
import { platform } from 'os';
import bodyParser from 'body-parser';
import Events from 'events';
import User, { UserI } from '../Schemas/User';
import Image, { ImageI } from '../Schemas/Image';
import VerifyingUser, { VUser } from '../Schemas/VerifyingUser';
import AdminNotifs, { Notification } from '../Schemas/Admin_Notifs';
import Utils from './Utils';
import Evolve from './Evolve';

const ee = new Events();

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

export interface Options {
    port?: number;
    url?: string;
    mongoUrl?: string;
    signups?: boolean;
    apiOnly?: boolean;
}

interface ActualOptions {
    port: number;
    url: string;
    mongoUrl: string;
    signups: boolean;
    apiOnly: boolean;
}

interface Schemas {
    User: mongoose.Model<UserI>;
    Image: mongoose.Model<ImageI>;
    VerifyingUser: mongoose.Model<VUser>;
    AdminNotifs: mongoose.Model<Notification>;
}

/**
 * @class Base
 *
 * @author Null#0515
 */
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
    public evolve: Evolve | void;

    public superagent: SuperAgent<SuperAgentRequest>;

    public web: express.Application;

    public schemas: Schemas;

    public Utils: Utils;

    public flags?: string;

    public signups: boolean;

    public options: ActualOptions;

    constructor(evolve: Evolve | null, options: Options, flags?: string) {
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

    /**
     * Fetch the configs auth type
     *
     * @param {Object} options Configuration
     * @returns {boolean|*}
     * @private
     */
    _fetchAuthType(options: Options): boolean {
        // If no options or signup options
        if (!options) return true;
        if (!options.signups) return true;
        // Handle if signups is not boolean or return
        if (![true, false].includes(options.signups) ) return true;
        return options.signups;
    }

    /**
     * Initialize the config
     *
     * @param {Object} options The configuration
     * @returns {Object} The new configuration
     * @private
     */
    _initConfig(options: Options): ActualOptions {
        // If options, loop through keys
        const opts = {}; /* eslint-disable */
        if (!options) return optionsBase;
        for (const key in optionsBase) {
            // If no key, add it from defaults
            // @ts-ignore
            if (!options[key] ) {
                // @ts-ignore
                opts[key] = optionsBase[key];
            } else {
                // @ts-ignore
                opts[key] = options[key];
            }
            // Handle database config, hopefully this will reduce the amount of errors people get
            // @ts-ignore
            if (key === 'mongoUrl' && opts[key].startsWith('mongodb://') ) {
                // @ts-ignore
                const mUrl = opts[key].slice(10);
                if (!mUrl.split('/')[1] ) {
                    // @ts-ignore
                    opts[key] += '/evolve-x';
                }
            } else {
                // @ts-ignore
                if (key === 'mongoUrl' && !opts[key].startsWith('mongodb://') ) { // More database handling
                    // @ts-ignore
                    const mUrl = opts.mongoUrl.split('/');
                    if (!mUrl[1] ) {
                        // @ts-ignore
                        opts[key] = `mongodb://${opts[key]}/evolve-x`;
                    } else {
                        // @ts-ignore
                        opts[key] = `mongodb://${opts[key]}`;
                    }
                }
            }
        } /* eslint-enable */
        return opts as ActualOptions;
    }

    /**
     * Initialize the mongoose connection, and the express app
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
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

            let uhm;

            try {
                uhm = await this.superagent.get(`localhost:${this.options.port}`);
            } catch (err) {
                if (err.message.startsWith('connect ECONNREFUSED') ) {
                    // I dont care about this error
                } else {
                    throw Error(err);
                }
            }
            // If a user is trying to listen to a port already used
            if (uhm && this.flags !== '--init-first') {
                ee.emit('fail');
                throw Error('You are trying to listen on a port in use!');
            }

            // Init the server

            this.web.listen(this.options.port);
            console.log(`[INFO] Signups are: ${!this.signups ? 'disabled' : 'enabled'}`);
        }
    }
}

export default Base;
