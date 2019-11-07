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

import superagent from 'superagent';
import { DiscordHook } from './Evolve-Config';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const sleep = promisify(setTimeout);

export interface WebhookExecOptions {
    url?: string;
    imageURL?: string;
    user?: string;
    responsible?: string;
}

export interface Field {
    name: string;
    value: string;
    inline?: boolean;
}

export interface EmbedData {
    color: number;
    title: string;
    description: string;
    fields?: Field[];
    image?: { url: string };
}

export type WebhookTypes = 'error' | 'deleteAccount' | 'online' | 'accountDeny' | 'accountAccept' | 'imageUpload' | 'imageDelete' | 'signup' | 'securityWarn' | 'adminGive' | 'adminRemove' | 'manage' | 'shorten' | 'shortRemove' | 'accUpdate' | 'accountDelete';

/**
 * @class DiscordHook
 *
 * @classdesc handles sending webhooks that log important information about Evolve-X or its status.
 *
 * @author VoidNulll
 */
class DiscordWebhookHandler {
    public webhookURL: string;

    public colors: any;

    public valid: boolean;

    private discordHook?: DiscordHook;

    private ratelimiter: {
        queue: any[];
        limits: number;
    };

    private isQueueGoing: boolean;

    private ee: EventEmitter;

    private ready: boolean;

    constructor(webhookURL: string, discordHook?: DiscordHook) {
        this.webhookURL = webhookURL;
        this.colors = {
            error: Number('0xFF0000'),
            deleteAccount: Number('0xfc0075'),
            online: Number('0x00fc82'),
            accountDeny: Number('0xbc004b'),
            accountAccept: Number('0x19fc05'),
            imageUpload: Number('0xabfca4'),
            imageDelete: Number('0xfca9a4'),
            signup: Number('0xcaf700'),
            securityWarn: Number('0x7f0002'),
            adminGive: Number('0x5d8dfc'),
            adminRemove: Number('0x7d5dfc'),
            manage: Number('0xfcaa5d'),
            shorten: Number('0xabfca4'),
            shortRemove: Number('0xfca9a4'),
            accUpdate: Number('0x1e9e95'),
            accountDelete: Number('0x53f1fc'),
        };
        this.discordHook = discordHook;
        this.valid = false;
        this._validateConfig(this.webhookURL);
        this.ratelimiter = {
            queue: [],
            limits: 0,
        };
        this.isQueueGoing = false;
        this.ee = new EventEmitter();
        this.ee.on('beginQueue', async() => {
            await this.ridQueue();
        } );
        this.ready = false;
    }

    /**
     * @desc Validate that the url given to us is a valid Discord URL
     * @async
     *
     * @param webhook {string} Discord webhook URL to validate
     * @private
     */
    async _validateConfig(webhook: string): Promise<void> {
        let output: any = await superagent.get(webhook);
        if (!output.text) {
            throw Error('[WebhookHandler - FATAL] - Invalid Webhook URL.');
        }
        output = JSON.parse(output.text);
        if (!output.name) {
            throw Error('[WebhookHandler - FATAL] - Invalid Webhook URL.');
        }
        this.valid = true;
        this.ready = true;
    }

    /**
     * @desc Helper function to determine if the ratelimit queue is active or not.
     *
     * @returns {boolean}
     */
    isQueue(): boolean {
        if (this.ratelimiter.queue.length > 0) {
            return true;
        }
        return this.ratelimiter.limits > 2;
    }

    /**
     * @desc Actually execute the webhook
     * @async
     *
     * @param type {WebhookTypes} The type of webhook to send
     * @param title {string} The title of the webhook
     * @param information {string} The body of the webhook (The info of the log)
     * @param options {WebhookExecOptions} The execute options for the webhook, also borrowed by logger.
     *
     * @returns {Promise<boolean | void>}
     * @private
     */
    async execute(type: WebhookTypes, title: string, information: string, options?: WebhookExecOptions): Promise<any> {
        const secs = 3000;
        if (!this.isQueue() && this.ready) {
            this.ratelimiter.limits++;
            setTimeout( () => {
                this.ratelimiter.limits -= 1;
            }, secs);
            return this._execute(type, title, information, options);
        } else {
            this.ratelimiter.queue.push( { type, title, information, options } );
            if (this.ratelimiter.queue.length > 0 && !this.isQueueGoing) {
                this.ee.emit('beginQueue');
                return;
            }
        }
        return false;
    }

    /**
     * @desc Actually execute the webhook
     * @async
     *
     * @param type {WebhookTypes} The type of webhook to send
     * @param title {string} The title of the webhook
     * @param information {string} The body of the webhook (The info of the log)
     * @param options {WebhookExecOptions} The execute options for the webhook, also borrowed by logger.
     *
     * @returns {Promise<boolean | void>}
     * @private
     */
    async _execute(type: WebhookTypes, title: string, information: string, options?: WebhookExecOptions): Promise<boolean | void> {
        if (!this.valid) {
            return false;
        }
        if (!type || !title || !information) {
            throw new Error('[WebhookHandler] - Missing arguments');
        }
        const color = this.colors[type];
        if (!color) {
            throw Error('[WebhookHandler] - Invalid type');
        }
        const data: EmbedData = {
            color,
            title,
            description: information,
        };
        const fields: Field[] = [];
        if (options && options.responsible) {
            fields.push( { name: 'User Responsible', value: options.responsible } );
        }
        if (options && options.user) {
            fields.push( { name: 'User', value: options.user } );
        }
        if (options && options.url) {
            fields.push( { name: 'URL', value: options.url } );
        }
        if (options && options.imageURL && options.imageURL.startsWith('http') ) {
            data.image = { url: options.imageURL };
        }
        if (options && options.imageURL && !options.imageURL.startsWith('http') ) {
            fields.push( { name: 'Image URL', value: options.imageURL } );
        }
        if (fields.length > 0) {
            data.fields = fields;
        }
        const aData: any = { embeds: [data] };
        if (this.discordHook) {
            aData.avatar_url = this.discordHook.avatar_url;
            aData.username = this.discordHook.name;
        }
        const out = await superagent.post(this.webhookURL).send(JSON.stringify(aData) );
        const noContent = 204;
        if (!out || out.status !== noContent) {
            throw Error('[Webhook Handler] - Webhook failed to send');
        }
        return true;
    }

    /**
     * @desc Make the thread pause.
     * @param ms {number} The milliseconds to pause for
     */
    // Taken from https://github.com/Khaazz/AxonCore/blob/d597089b80615fdd5ceab8f0a1b1d83f70fc5187/src/Utility/Utils.js#L355
    async sleep(ms: number): Promise<void> {
        await sleep(ms);
        return Promise.resolve();
    }

    /**
     * @desc Remove an item from the queue and then if there are still items recall this method
     * @async
     * @returns {Promise<*>}
     */
    async ridQueue(): Promise<any> {
        const secs = 3000;
        if (this.ratelimiter.queue.length > 0) {
            this.isQueueGoing = true;
            if (!this.ready) {
                await this.sleep(secs);
                return this.ridQueue();
            }
            const { type, title, information, options } = this.ratelimiter.queue.shift();
            this._execute(type, title, information, options);
            await this.sleep(secs);
            if (this.ratelimiter.queue.length > 0) {
                return this.ridQueue();
            }
        }

        this.isQueueGoing = false;
        return false;
    }
}

export default DiscordWebhookHandler;
