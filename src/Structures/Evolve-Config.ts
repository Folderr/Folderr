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
}

const optionsBase: ActualOptions = {
    port: 8888,
    url: 'localhost',
    mongoUrl: 'mongodb://localhost/evolve-x',
    signups: true,
    apiOnly: false,
    trustProxies: false,
};

/**
 * @class EvolveConfig
 *
 * Class for generating the Evolve-x config
 *
 * @author Null
 */
class EvolveConfig implements ActualOptions {
    /**
     * @param {Object<Options>} config=optionsBase The configuration for the app from the user.
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
    }

    /**
     * @private
     *
     * Verifies the majority of the Evolve configuration.
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
