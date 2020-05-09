/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 VoidNulll
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

// I took inspiration from https://github.com/Khaazz/AxonCore/blob/dev-2.0/src/AxonOptions.js for this
// Hope you do not mind, KhaaZ.

import fs from 'fs';

interface CertOptions {
    key?: string | any;
    cert?: string | any;
    requestCert?: boolean;
    ca?: string[] | any[];
}

interface EmailOptions {
    contactEmail: string;
    mailerOptions?: {
        auth: {
            user: string;
            pass: string;
        };
        port?: number;
        secure?: boolean;
        host: string;
        requireTLS?: boolean;
        ignoreTLS?: boolean;
    };
    sendingEmail?: string;
}

export interface DiscordHook {
    name?: string;
    avatar_url?: string;
}

export interface SharderOptions {
    enabled: boolean;
    maxCores: number;
    maxMemory: string;
}

export interface SecurityOptions {
    disableInsecure?: boolean;
}

export interface KeyOptions {
    privKeyPath: string;
    algorithm?: string;
    pubKeyPath: string;
}

export interface Options {
    port?: number;
    url?: string;
    mongoUrl?: string;
    signups?: 0 | 1 | 2;
    apiOnly?: boolean;
    trustProxies?: boolean;
    certOptions?: CertOptions;
    discordURL?: string;
    enableDiscordLogging?: boolean;
    discordHook?: DiscordHook;
    sharder?: SharderOptions;
    security?: SecurityOptions;
    auth: string | KeyOptions;
    email?: EmailOptions;
}

export interface ActualOptions {
    port: number;
    url: string;
    mongoUrl: string;
    signups: 0 | 1 | 2;
    apiOnly: boolean;
    trustProxies: boolean;
    certOptions?: CertOptions;
    discordURL?: string;
    enableDiscordLogging?: boolean;
    discordHook?: DiscordHook;
    sharder?: SharderOptions;
    security: SecurityOptions;
    auth: string | KeyOptions;
    email?: EmailOptions;
}

const optionsBase: ActualOptions = {
    port: 8888,
    url: 'localhost',
    mongoUrl: 'mongodb://localhost/folderr',
    signups: 1,
    apiOnly: false,
    trustProxies: false,
    sharder: { enabled: false, maxCores: 48, maxMemory: '4G' },
    security: { disableInsecure: false },
    auth: 'no',
};

/**
 * @class FolderrConfig
 *
 * @classdesc Class for generating & validating the Folderr config
 *
 * @author Null
 */
class FolderrConfig implements ActualOptions {
    /**
     * @param {Object<Options>} config=optionsBase The configuration for the app from the user.
     * @implements ActualOptions
     *
     * @property {Number} port  The port the application will use
     * @property {String} url The URL the application will use
     * @property {String} mongoUrl The URL the app will use to connect to mongodb
     * @property {Boolean} signups Whether or not signups are enabled
     * @property {Boolean} apiOnly Whether or not to disable the frontend
     */
    public port: number;

    public url: string;

    public mongoUrl: string;

    public signups: 0 | 1 | 2;

    public apiOnly: boolean;

    public trustProxies: boolean;

    public certOptions?: CertOptions;

    public enableDiscordLogging?: boolean;

    public discordURL?: string;

    public discordHook?: DiscordHook;

    public sharder: SharderOptions;

    public security: SecurityOptions;

    public auth: string | KeyOptions;

    public email?: EmailOptions;

    constructor(config: Options = optionsBase) {
        this.port = config.port || optionsBase.port;
        this.url = config.url || optionsBase.url;
        this.mongoUrl = config.mongoUrl || optionsBase.mongoUrl;
        this.signups = config.signups === undefined ? 1 : config.signups;
        this.apiOnly = config.apiOnly || optionsBase.apiOnly;
        this.trustProxies = config.trustProxies || optionsBase.trustProxies;
        this.discordURL = config.discordURL;
        this.enableDiscordLogging = config.enableDiscordLogging || false;
        this.certOptions = {
            key: (config && config.certOptions && config.certOptions.key),
            cert: (config && config.certOptions && config.certOptions.cert),
            ca: (config && config.certOptions && config.certOptions.ca),
            requestCert: (config && config.certOptions && Boolean(config.certOptions.requestCert) ),
        };
        this.discordHook = config.discordHook;
        this.auth = config.auth;
        if (this.auth === 'no') {
            console.log('[FATAL - CONFIG] AUTH MUST BE PRESENT AND NOT BE "NO"!');
            process.exit(1);
        }
        this.email = config.email;
        this.verify();
        const baseSharder = { enabled: false, maxCores: 48, maxMemory: '4G' };
        this.sharder = baseSharder;
        if (config.sharder) {
            this.sharder = { enabled: config.sharder.enabled, maxMemory: config.sharder.maxMemory || baseSharder.maxMemory, maxCores: config.sharder.maxCores || baseSharder.maxCores };
        }

        this.security = (config.security && {
            disableInsecure: config.security.disableInsecure || false,
        } ) || { disableInsecure: false };
    }

    /**
     * @private
     *
     * @desc Verifies the majority of the Folderr configuration.
     *
     * @returns {Object<ActualOptions>} The finale options.
     */
    private verify(): ActualOptions {
        this.apiOnly = Boolean(this.apiOnly);
        const maxPort = 65535;
        if (this.port > maxPort || isNaN(Number(this.port) ) ) {
            this.port = 8888;
        }
        if (!this.mongoUrl.startsWith('mongodb://') ) {
            if (!this.mongoUrl.includes('/') ) {
                this.mongoUrl = `mongodb://${this.mongoUrl}/evolve-x`;
            } else {
                this.mongoUrl = `mongodb://${this.mongoUrl}`;
            }
        } else {
            const ah = this.mongoUrl.slice(10);
            if (!ah.match(/\/[0-9A-Za-z_]/) ) {
                this.mongoUrl += '/folderr';
            }
        }
        if (typeof this.auth === 'string' && this.auth === 'no') {
            console.log('[FATAL - CONFIG] AUTHENTICATION MISSING. PROVIDE EITHER A STRING OR A PUBLIC KEY & PRIVATE KEY PATH OBJECT');
            process.exit(1);
        }
        if (typeof this.auth === 'object') {
            if (this.auth.privKeyPath === this.auth.pubKeyPath) {
                console.log('[FATAL - CONFIG] Private key must not be public key!');
                process.exit(1);
            }
            if (!fs.existsSync(this.auth.privKeyPath) || !fs.existsSync(this.auth.pubKeyPath) ) {
                console.log('[FATAL - CONFIG] Authorization key(s) are missing!');
                process.exit(1);
            }
        }
        if (!this.email || !this.email.contactEmail) {
            console.log('[FATAL - CONFIG] CONTACT EMAIL MISSING');
            process.exit(1);
        }
        return this;
    }
}

export default FolderrConfig;
