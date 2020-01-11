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
import Upload, { UploadI } from '../Schemas/Image';
import VerifyingUser, { VUser } from '../Schemas/VerifyingUser';
import AdminNotifs, { Notification } from '../Schemas/Admin_Notifs';
import Shorten, { Short } from '../Schemas/Short';
import BearerTokens, { BearerTokenSchema } from '../Schemas/BearerTokens';
import Utils from './Utils';
import Evolve from './Evolve';
import Logger from './Logger';
import EvolveConfig, { ActualOptions, Options } from './Evolve-Config';
import { join } from 'path';
import { readFileSync } from 'fs';
import https from 'https';
import cluster, { isMaster } from 'cluster';

const ee = new Events();

ee.on('fail', () => {
    setTimeout( () => {
        process.exit();
    }, 1000);
} );

const web = express();

interface Schemas {
    User: mongoose.Model<UserI>;
    Upload: mongoose.Model<UploadI>;
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

    public useSharder: boolean;

    public shardNum: number;

    public sharderReady?: boolean;

    public maxShardNum: number;

    constructor(evolve: Evolve | null, options: Options, flags?: string) {
        this.evolve = evolve;
        this.superagent = superagent;
        this.web = web;
        this.web.use(bodyParser.json() );
        this.web.use(express.urlencoded( { extended: false } ) );
        this.web.use(express.static(join(__dirname, '../Frontend') ) );
        this.web.use('/assets', express.static(join(__dirname, '../assets') ) );
        this.web.use('/', express.static(join(__dirname, '../otherFiles') ) );
        this.web.use(cookieParser() );
        this.schemas = {
            User, Upload, VerifyingUser, AdminNotifs, Shorten, BearerTokens,
        };
        this.Utils = new Utils(evolve, this);
        this.flags = flags;
        this.options = new EvolveConfig(options);
        this.Logger = new Logger(this.options);
        this.useSharder = false;
        this.shardNum = 0;
        this.maxShardNum = 0;
        this.initBasics();
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
        }
        this.web.listen(this.options.port);
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
        const db = mongoose.connection;
        db.on('error', (err) => {
            if (this.useSharder && !isMaster) {
                return;
            }
            if (process.env.NODE_ENV !== 'test') {
                console.log(`[FATAL - DB] MongoDB connection fail!\n${err}\n[FATAL] Evolve-X is unable to work without a database! Evolve-X process terminated.`);
                process.exit(1);
            }
        } );
        db.once('open', () => {
            if (this.useSharder && !isMaster) {
                return;
            }
            console.log('[SYSTEM - DB] Connected to MongoDB!');
        } );

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
            const rootPort = 1024;
            if (process.getuid && process.getuid() === linuxRootUid && Number(this.options.port) < rootPort) {
                console.log('[SYSTEM WARN] It is advised to not run apps as root, I would prefer if you ran me through a proxy like Nginx!');
            }

            let uhm;

            if (!this.useSharder) {
                try {
                    uhm = await this.superagent.get(`localhost:${this.options.port}`);
                } catch (err) {
                    if (err.message.startsWith('connect ECONNREFUSED') ) {
                        // I dont care about this error
                    } else {
                        throw Error(err);
                    }
                }
            }
            // If a user is trying to listen to a port already used
            if (uhm && this.flags !== '--init-first') {
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
                        console.log(`[WORKER] worker ${worker.process.pid} died (${this.shardNum}/${this.maxShardNum})\n[WORKER - RESTART] Attempting to bring shard back online`);

                        this.sendToWorkers( { messageType: 'shardNum', value: this.shardNum } );
                        cluster.fork();
                    } );
                    cluster.on('online', worker => {
                        this.shardNum++;
                        console.log(`[WORKER] worker ${worker.process.pid} started (${this.shardNum}/${this.maxShardNum})`);

                        this.sendToWorkers( { messageType: 'shardNum', value: this.shardNum } );
                    } );
                    console.log(`[SYSTEM INFO] Signups are: ${!this.options.signups ? 'disabled' : 'enabled'}`);
                } else {
                    const messg = this.onWorkerMessage.bind(this);
                    cluster.worker.on('message', messg);
                    this.listen();
                }
                return;
            }

            // Init the server
            this.listen();
            console.log(`[SYSTEM INFO] Signups are: ${!this.options.signups ? 'disabled' : 'enabled'}`);
        }
    }

    killClusters(): Promise<true> {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        return new Promise(resolve => {
            for (const id in cluster.workers) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cluster.workers[id].disconnect();
            }
            resolve(true);
        } );
    }

    async killAll(): Promise<boolean> {
        if (!cluster.isMaster) {
            return false;
        }
        await this.killClusters();
        console.log('[SHUTDOWN] Killed all worker processes/shards.\n[SYSTEM] I will die in peace now');
        return true;
    }

    async onMasterMessage(worker: cluster.Worker, msg: { messageType: string; value: any; sendToAll?: boolean } ): Promise<void> {
        if (!cluster.isMaster) {
            return;
        }
        if (msg.messageType === 'kill') {
            await this.killAll();
            process.exit();
        }
        if (msg.sendToAll) {
            delete msg.sendToAll;
            this.sendToWorkers(msg, String(worker.id) );
        }
    }

    onWorkerMessage(msg: { messageType: string; value: any } ): void {
        if (!cluster.isWorker) {
            return;
        }
        if (msg.messageType === 'shardNum' && typeof msg.value === 'number') {
            this.shardNum = msg.value;
        } else if (msg.messageType === 'ipAdd' && this.evolve) {
            this.evolve.addIP(msg.value);
        } else if (msg.messageType === 'banAdd' && this.evolve) {
            this.evolve.addIPBan(msg.value);
        } else if (msg.messageType === 'ipRemove' && this.evolve) {
            this.evolve.removeIP(msg.value);
        } else if (msg.messageType === 'banRemove' && this.evolve) {
            this.evolve.removeIPBan(msg.value);
        }
    }

    sendToMaster(data: { messageType: string; value: any; sendToAll?: boolean } ): void {
        if (!cluster.isWorker) {
            return;
        }

        cluster.worker.send(data);
    }

    sendToWorkers(data: { messageType: string; value: any }, fromWorker?: string): boolean {
        if (!isMaster) {
            return false;
        }
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
}

export default Base;
