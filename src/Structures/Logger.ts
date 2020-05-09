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

/* eslint-disable @typescript-eslint/ban-ts-ignore */
import WebhookHandler, { WebhookExecOptions, WebhookTypes } from './DiscordWebhookHandler';
import { ActualOptions, DiscordHook } from './Folderr-Config';

interface LoggerOptions {
    discordURL?: string;
    enableDiscordLogging?: boolean;
}

/**
 * @class Logger
 *
 * @author VoidNulll
 *
 * @classdesc Class to handle logging items inn a consistent way.
 */
class Logger implements LoggerOptions {
    public enableDiscordLogging?: boolean;

    public discordURL?: string;

    public webhookHandler?: WebhookHandler;

    private discordHook?: DiscordHook;

    private isMaxCores?: boolean;

    /**
     * @param [options] {ActualOptions} The options the Folderr-X client uses, contains needed options.
     * @prop [discordURL] {string} Discord webhook URL
     * @prop [enableDiscordLogging] {boolean} Whether or not to log items with discord
     * @prop [discordHook] {object<{ name: string, avatar_url: string }>} Options to customize your webhook
     */
    constructor(options?: ActualOptions) {
        this.discordURL = options && options.discordURL;
        this.enableDiscordLogging = options && options.enableDiscordLogging;
        this.discordHook = options && options.discordHook;
        this.isMaxCores = options && options.sharder && options.sharder.enabled;
        this._init();
    }

    /**
     * @desc Init the webhook logger
     * @private
     */
    _init(): void {
        if (this.discordURL && this.enableDiscordLogging) {
            this.webhookHandler = new WebhookHandler(this.discordURL, this.discordHook, this.isMaxCores);
        } else {
            this.enableDiscordLogging = false;
        }
    }

    /**
     * @desc Checks for the URL options, used in log function.
     * @param [options] {object<WebhookExecOptions>} The options for the logger.
     *
     * @returns {boolean}
     */
    checkURLOptions(options?: WebhookExecOptions): boolean {
        if (!options) {
            return false;
        }
        if (!options.url && !options.imageURL) {
            return false;
        }
        return true;
    }

    /**
     * @desc Log something to Discord, or try to...
     *
     * @async
     *
     * @param type {string} The type of log it is logging;
     * @param information {string} The information to send with the log
     * @param options {WebhookExecOptions} Options for executing a webhook, helps with logging URLs & users.
     * @param wType {WebhookTypes} The type of webhook to send, if any.
     * @param wTitle {string} The title of the webhook
     *
     * @return {Promise<*>}
     */
    log(type: string, information: string, options?: WebhookExecOptions, wType?: WebhookTypes, wTitle?: string): Promise<any> {
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
        if (!wType || !wTitle || !this.enableDiscordLogging || !this.webhookHandler) {
            return Promise.resolve(false);
        }
        if (!this.webhookHandler.valid && wType !== 'online') {
            return Promise.resolve(false);
        }
        if (information.match(/from ip/i) ) {
            information = information.split(/from ip/i)[0];
        }
        return this.webhookHandler.execute(wType, wTitle, information, options);
    }
}

export default Logger;
