/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
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

import superagent, { SuperAgent, SuperAgentRequest } from 'superagent';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { platform } from 'os';
import bodyParser from 'body-parser';
import Events from 'events';
import Utils from './Utilities/Utils';
import Folderr from './Folderr';
import Logger from './Logger';
import FolderrConfig, { ActualOptions, Options } from './Folderr-Config';
import { join } from 'path';
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';
import cluster, { isMaster } from 'cluster';
import DB from './Database/DBClass';
import { pickDB } from './Database/Pick';
import { ChildProcess, fork } from 'child_process';
import Emailer from './Emailer';
import { RateLimiterClusterMaster } from 'rate-limiter-flexible';
import { MemoryLimiter, ClusterLimiter, LimiterBase } from './Middleware/ratelimiter';
import wlogger from './WinstonLogger';
import winston from 'winston';

const ee = new Events.EventEmitter();

ee.on('fail', () => {
    setTimeout( () => {
        process.exit();
    }, 1000);
} );

const web = express();

/**
 * @classdesc Handles initialization and provides ways to access most important things and holds config.
 *
 * @author VoidNulll
 */
class Base {
    /**
     * @param {Object} evolve The Folderr client
     * @param {Object} [options={}] The options for the image host
     * @param {String} [flags=''] The flags, used for the first initiation
     *
     * @prop {Object} evolve The evolve client
     * @prop {Object} superagent The superagent dependency
     * @prop {Object} _options The constructor options, deleted later
     * @prop {Object} web The express server
     * @prop {Object} schemas The schemas used by Folderr-X
     * @prop {Object} Utils the utilities for Folderr-X
     * @prop {String} flags The runtime flags for the base
     *
     * @prop {Object} options The Folderr-X options, initiated later
     * */
    public folderr: Folderr | null;

    public superagent: SuperAgent<SuperAgentRequest>;

    public web: express.Application;

    public db: DB;

    public Utils: Utils;

    public flags?: string;

    public options: ActualOptions;

    public Logger: Logger;

    public useSharder: boolean;

    public shardNum: number;

    public sharderReady?: boolean;

    public maxShardNum: number;

    private deleter: ChildProcess;

    public emailer: Emailer;

    public limiter!: LimiterBase;

    readonly logger: winston.Logger;

    private server!: http.Server;

    constructor(folderr: Folderr, options: Options, flags?: string) {
        this.logger = wlogger;
        this.folderr = folderr;
        this.superagent = superagent;
        this.web = web;
        this.web.use(helmet() );
        this.web.use(bodyParser.json() );
        this.web.use(express.urlencoded( { extended: false } ) );
        this.web.use(express.static(join(__dirname, '../Frontend') ) );
        this.web.use('/assets', express.static(join(__dirname, '../assets') ) );
        this.web.use('/', express.static(join(__dirname, '../otherFiles') ) );
        this.web.use(cookieParser() );
        this.Utils = new Utils(folderr, this);
        this.flags = flags;
        this.options = new FolderrConfig(options);
        this.db = pickDB();
        this.Logger = new Logger(this.options);
        this.useSharder = false;
        this.shardNum = 0;
        this.maxShardNum = 0;
        this.initBasics();
        if (this.useSharder) {
            if (cluster.isMaster) {
                // eslint-disable-next-line no-new
                new RateLimiterClusterMaster();
                this.limiter = new ClusterLimiter();
            } else {
                this.limiter = new ClusterLimiter();
            }
        } else {
            this.limiter = new MemoryLimiter();
        }
        this.web.use(this.limiter.consumer.bind(this.limiter) );
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        this.deleter = fork(join(__dirname, '../FileDelQueue'), undefined, { silent: true, windowsHide: true } );
        // I would like to point out that windowsHide is an actual option here.
        // The typings and documentation are incorrect.
        // This takes the same arguments as child_process.spawn afaict.
        this.emailer = new Emailer(this.folderr, this.options.email?.sendingEmail, this.options.email?.mailerOptions);
    }

    listen(): void {
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
            this.server = server;
        }
        const server = http.createServer(this.web);
        server.listen(this.options.port);
        this.server = server;
    }

    initBasics(): void {
        if (this.options.sharder && this.options.sharder.enabled) {
            const asharder = this.Utils.shardLimit(this.options.sharder);
            if (asharder && typeof asharder === 'number') {
                this.maxShardNum = asharder;
                this.useSharder = true;
            }
        }
        this.sharderReady = true;
    }

    async initDB(): Promise<void> {
        await this.db.init(this.options.mongoUrl, this.useSharder);
    }

    /**
     * @desc Initialize the mongoose connection, and the express app
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        if (this.flags !== '--init-first') {
            // If there are no paths, exit
            if (!this.folderr || !this.folderr.paths || this.folderr.paths.size < 1) {
                this.logger.error('No paths. Exiting...');
                process.exit();
            }
        }

        if (this.options.trustProxies) {
            this.web.enable('trust proxy');
        }

        // Initiate the database
        await this.db.init(this.options.mongoUrl, this.useSharder);

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
            // Please dont run servers as root on linux..
            const rootPort = 1024;
            if (process.getuid && process.getuid() === linuxRootUid && Number(this.options.port) < rootPort) {
                this.logger.log('warn', 'It is advised to not run apps as root, I would prefer if you ran me through a proxy like Nginx!');
            }

            let uhm;

            if (!this.useSharder) {
                try {
                    uhm = await this.superagent.get(`localhost:${this.options.port}`);
                } catch (err) {
                    if (err.message.startsWith('connect ECONNREFUSED') || (err.response && err.response.notFound) ) {
                        // I dont care about this error
                    } else {
                        throw Error(err);
                    }
                }
            }
            // If a user is trying to listen to a port already used
            if (uhm) {
                ee.emit('fail');
                throw Error('[FATAL] You are trying to listen on a port in use!');
            }
            if (this.useSharder && this.maxShardNum) {
                if (cluster.isMaster) {
                    const onMM = this.onMasterMessage.bind(this);
                    cluster.on('message', onMM);
                    for (let i = 0; i < this.maxShardNum; i++) {
                        cluster.fork();
                    }

                    cluster.on('exit', (worker) => {
                        this.shardNum--;
                        this.logger.verbose(`Worker ${worker.process.pid} died (${this.shardNum}/${this.maxShardNum})\nAttempting to bring worker back online`);

                        this.sendToWorkers( { messageType: 'shardNum', value: this.shardNum } );
                        cluster.fork();
                    } );
                    cluster.on('online', worker => {
                        this.shardNum++;
                        this.logger.verbose(`Worker ${worker.process.pid} started (${this.shardNum}/${this.maxShardNum})`);

                        this.sendToWorkers( { messageType: 'shardNum', value: this.shardNum } );
                    } );
                    this.logger.info(`Signups are: ${!this.options.signups ? 'disabled' : 'enabled'}`);
                } else {
                    this.listen();
                }
                return;
            }

            // Init the server
            this.listen();
            this.logger.info(`Signups are: ${!this.options.signups ? 'disabled' : 'enabled'}`);
        }
    }

    addDeleter(userID: string): void {
        if (isMaster) {
            this.deleter.send( { message: 'add', data: userID } );
        } else {
            this.sendToMaster( { messageType: 'add', value: userID } );
        }
    }

    killClusters(): Promise<true> {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        return new Promise(resolve => {
            for (const id in cluster.workers) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cluster.workers[id].send( { messageType: 'shutdown' } );
            }
            resolve(true);
        } );
    }

    async killAll(): Promise<boolean> {
        if (!cluster.isMaster) {
            return false;
        }
        await this.killClusters();
        wlogger.notice('Killed all worker processes/shards.');
        return true;
    }

    async onMasterMessage(worker: cluster.Worker, msg: { messageType: string; value: any; sendToAll?: boolean } ): Promise<void> {
        if (!cluster.isMaster) {
            return;
        }
        if (msg.messageType === 'add') {
            this.addDeleter(msg.value);
        }
        if (msg.messageType === 'kill') {
            await this.killAll();
        }
        if (msg.messageType === 'shutdown' && msg.value === true) {
            worker.disconnect();
            this.shardNum--;
            if (this.shardNum === 0) {
                const secs = 5000;
                await this.Utils.sleep(secs);
                this.shutdown();
            }
        }
        if (msg.sendToAll) {
            delete msg.sendToAll;
            this.sendToWorkers(msg, String(worker.id) );
        }
    }

    sendToMaster(data: { messageType: string; value: any; sendToAll?: boolean } ): void {
        if (!cluster.isWorker) {
            return;
        }

        cluster.worker.send(data);
    }

    async onWorkerMesssage(msg: { messageType: string; value: any } ): Promise<void> {
        if (!cluster.isWorker) {
            return;
        }

        if (msg.messageType === 'shardNum' && !Number.isNaN(msg.value) ) {
            this.shardNum = msg.value;
        } else if (msg.messageType === 'shutdown') {
            await this.shutdown();
            this.sendToMaster( { messageType: 'shutdown', value: true } );
        }
    }

    sendToWorkers(data: { messageType: string; value: any }, fromWorker?: string): boolean {
        /* if (!isMaster) {
            return false;
        } */
        for (const id in cluster.workers) {
            if (fromWorker && id !== fromWorker) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cluster.workers[id].send(data);
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cluster.workers[id].send(data);
            }
        }
        return true;
    }

    async shutdown(): Promise<void> {
        if (this.shardNum && this.useSharder) {
            if (!isMaster) {
                this.sendToMaster( { messageType: 'kill', value: true } );
                return;
            }
            await this.killAll();
            return;
        }
        this.server.close(async() => {
            await this.db.shutdown();
            if (isMaster) {
                this.deleter.send( { msg: 'check' } );
                this.deleter.on('message', (msg: { msg: { onGoing?: boolean; shutdown?: boolean } } ) => {
                    if (msg.msg.onGoing && msg.msg.onGoing === true) {
                        this.deleter.send( { msg: 'shutdown' } );
                    }
                    if (msg.msg.shutdown && msg.msg.shutdown === true) {
                        wlogger.info('System has shutdown.');
                        wlogger.end();
                        wlogger.on('close', () => {
                            process.exit(0);
                        } );
                    }
                } );
            }
            wlogger.end();
            return;
        } );
    }
}

export default Base;
