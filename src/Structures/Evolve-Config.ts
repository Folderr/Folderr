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

// I took inspiration from https://github.com/Khaazz/AxonCore/blob/dev-2.0/src/AxonOptions.js for this
// Hope you do not mind, KhaaZ.

interface CertOptions {
    key?: string | any;
    cert?: string | any;
    requestCert?: boolean;
    ca?: string[] | any[];
}

export interface DiscordHook {
    name?: string;
    avatar_url?: string;
}

export interface Options {
    port?: number;
    url?: string;
    mongoUrl?: string;
    signups?: boolean;
    apiOnly?: boolean;
    trustProxies?: boolean;
    certOptions?: CertOptions;
    discordURL?: string;
    enableDiscordLogging?: boolean;
    discordHook?: DiscordHook;
    maxCores?: boolean;
}

export interface ActualOptions {
    port: number;
    url: string;
    mongoUrl: string;
    signups: boolean;
    apiOnly: boolean;
    trustProxies: boolean;
    certOptions?: CertOptions;
    discordURL?: string;
    enableDiscordLogging?: boolean;
    discordHook?: DiscordHook;
    maxCores?: boolean;
}

const optionsBase: ActualOptions = {
    port: 8888,
    url: 'localhost',
    mongoUrl: 'mongodb://localhost/evolve-x',
    signups: true,
    apiOnly: false,
    trustProxies: false,
    maxCores: false,
};

/**
 * @class EvolveConfig
 *
 * @classdesc Class for generating & validating the Evolve-x config
 *
 * @author Null
 */
class EvolveConfig implements ActualOptions {
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

    public signups: boolean;

    public apiOnly: boolean;

    public trustProxies: boolean;

    public certOptions?: CertOptions;

    public enableDiscordLogging?: boolean;

    public discordURL?: string;

    public discordHook?: DiscordHook;

    public maxCores?: boolean;

    constructor(config: Options = optionsBase) {
        this.port = config.port || optionsBase.port;
        this.url = config.url || optionsBase.url;
        this.mongoUrl = config.mongoUrl || optionsBase.mongoUrl;
        this.signups = config.signups === undefined ? true : config.signups;
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
        this.verify();
        this.maxCores = config.maxCores;
    }

    /**
     * @private
     *
     * @desc Verifies the majority of the Evolve configuration.
     *
     * @returns {Object<ActualOptions>} The finale options.
     */
    private verify(): ActualOptions {
        this.apiOnly = Boolean(this.apiOnly);
        this.signups = Boolean(this.signups);
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
                this.mongoUrl += '/evolve-x';
            }
        }
        return this;
    }
}

export default EvolveConfig;
