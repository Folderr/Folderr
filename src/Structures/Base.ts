/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * @author VoidNulll
 * @version 0.8.0
 */

import superagent, { SuperAgent, SuperAgentRequest } from 'superagent';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { platform } from 'os';
import bodyParser from 'body-parser';
import Events from 'events';
import User, { UserI } from '../Schemas/User';
import Image, { ImageI } from '../Schemas/Image';
import VerifyingUser, { VUser } from '../Schemas/VerifyingUser';
import AdminNotifs, { Notification } from '../Schemas/Admin_Notifs';
import Shorten, { Short } from '../Schemas/Short';
import BearerTokens, { BearerTokenSchema } from '../Schemas/BearerTokens';
import Utils from './Utils';
import Evolve from './Evolve';
import Logger from './Logger';
import EvolveConfig, { Options, ActualOptions } from './Evolve-Config';
import { join } from 'path';
import { readFileSync } from 'fs';
import https from 'https';

const ee = new Events();

ee.on('fail', () => {
    setTimeout( () => {
        process.exit();
    }, 1000);
} );

const web = express();

interface Schemas {
    User: mongoose.Model<UserI>;
    Image: mongoose.Model<ImageI>;
    VerifyingUser: mongoose.Model<VUser>;
    AdminNotifs: mongoose.Model<Notification>;
    Shorten: mongoose.Model<Short>;
    BearerTokens: mongoose.Model<BearerTokenSchema>;
}

/**
 * @class Base
 *
 * @classdesc Handles initialization and provides was to access most important things and holds config.
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
    public evolve: Evolve | null;

    public superagent: SuperAgent<SuperAgentRequest>;

    public web: express.Application;

    public schemas: Schemas;

    public Utils: Utils;

    public flags?: string;

    public options: ActualOptions;

    public Logger: Logger;

    constructor(evolve: Evolve | null, options: Options, flags?: string) {
        this.evolve = evolve;
        this.superagent = superagent;
        this.web = web;
        this.web.use(bodyParser.json() );
        this.web.use(express.urlencoded() );
        this.web.use(express.static(join(__dirname, '../Frontend') ) );
        this.web.use('/assets', express.static(join(__dirname, '../assets') ) );
        this.web.use('/', express.static(join(__dirname, '../otherFiles') ) );
        this.web.use(cookieParser() );
        this.schemas = {
            User, Image, VerifyingUser, AdminNotifs, Shorten, BearerTokens,
        };
        this.Utils = new Utils(evolve);
        this.flags = flags;
        this.options = new EvolveConfig(options);
        this.Logger = new Logger(this.options);
    }

    /**
     * @desc Initialize the mongoose connection, and the express app
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        if (this.flags !== '--init-first') {
            // If there are no paths, exit
            if (!this.evolve || !this.evolve.paths || this.evolve.paths.size < 1) {
                console.log('No paths. Exiting...');
                process.exit();
            }
        }

        if (this.options.trustProxies) {
            this.web.enable('trust proxy');
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
                console.log('[SYSTEM WARN] It is advised to not run apps as root, I would prefer if you ran me through a proxy like Nginx!');
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
                throw Error('[FATAL] You are trying to listen on a port in use!');
            }

            // Init the server
            if (this.options.certOptions && this.options.certOptions.key && this.options.certOptions.cert) {
                this.options.certOptions.key = readFileSync(this.options.certOptions.key);
                this.options.certOptions.cert = readFileSync(this.options.certOptions.cert);
                if (this.options.certOptions.ca && Array.isArray(this.options.certOptions.ca) ) {
                    const cas = [];
                    for (const ca of this.options.certOptions.ca) {
                        cas.push(readFileSync(ca) );
                    }
                    this.options.certOptions.ca = cas;
                }
                const httpOptions = this.options.certOptions;
                const server = https.createServer(httpOptions, this.web);
                server.listen(this.options.port);
            }
            this.web.listen(this.options.port);
            console.log(`[SYSTEM INFO] Signups are: ${!this.options.signups ? 'disabled' : 'enabled'}`);
        }
    }
}

export default Base;
