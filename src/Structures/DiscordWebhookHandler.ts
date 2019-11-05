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

export type WebhookTypes = 'error' | 'deleteAccount' | 'online' | 'accountDeny' | 'accountAccept' | 'imageUpload' | 'imageDelete' | 'signup' | 'securityWarn' | 'adminGive' | 'adminRemove' | 'shutdown' | 'shorten' | 'shortRemove' | 'accUpdate' | 'accountDelete';

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
            shutdown: Number('0xfcaa5d'),
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

    async _validateConfig(webhook: string) {
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

    isQueue() {
        if (this.ratelimiter.queue.length > 0) {
            return true;
        }
        return this.ratelimiter.limits > 2;
    }

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
            }
        }
    }

    async _execute(type: WebhookTypes, title: string, information: string, options?: WebhookExecOptions) {
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

    async sleep(ms: number): Promise<void> {
        await sleep(ms);
        return Promise.resolve();
    }

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
