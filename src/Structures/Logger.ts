/* eslint-disable @typescript-eslint/ban-ts-ignore */
import WebhookHandler, { WebhookExecOptions, WebhookTypes } from './DiscordWebhookHandler';
import { ActualOptions, DiscordHook } from './Evolve-Config';

interface LoggerOptions {
    discordURL?: string;
    enableDiscordLogging?: boolean;
}

class Logger implements LoggerOptions {
    public enableDiscordLogging?: boolean;

    public discordURL?: string;

    public webhookHandler?: WebhookHandler;

    private discordHook?: DiscordHook;

    constructor(options?: ActualOptions) {
        this.discordURL = options && options.discordURL;
        this.enableDiscordLogging = options && options.enableDiscordLogging;
        this.discordHook = options && options.discordHook;
        this._init();
    }

    _init() {
        if (this.discordURL && this.enableDiscordLogging) {
            this.webhookHandler = new WebhookHandler(this.discordURL, this.discordHook);
        } else {
            this.enableDiscordLogging = false;
        }
    }

    checkURLOptions(options?: WebhookExecOptions) {
        if (!options) {
            return false;
        }
        if (!options.url && !options.imageURL) {
            return false;
        }
        return true;
    }

    log(type: string, information: string, options?: WebhookExecOptions, wType?: WebhookTypes, wTitle?: string) {
        let base = `[${type}] - ${information}`;
        if (this.checkURLOptions(options) ) {
            // @ts-ignore
            base += `\n    --- URL: ${options.imageURL || options.url}`;
        }
        if (options && options.user) {
            base += `\n    --- User: ${options.user}`;
        }
        if (options && options.responsible) {
            base += `\n    --- User Responsible: ${options.responsible}`;
        }
        console.log(base);
        if (!wType || !wTitle || !this.enableDiscordLogging || !this.webhookHandler || !this.webhookHandler.valid) {
            return;
        }
        if (information.match(/from ip/i) ) {
            information = information.split(/from ip/i)[0];
        }
        this.webhookHandler.execute(wType, wTitle, information, options);
    }
}

export default Logger;
