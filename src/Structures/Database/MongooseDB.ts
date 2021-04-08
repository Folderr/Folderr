/* eslint-disable consistent-return */
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

import DBClass, {
    User, TokenDB, Link, PendingMember, Upload, Notification, Folderr,
} from './DBClass';
import mongoose from 'mongoose';
import * as Schemas from '../../Schemas/index';
import { existsSync, promises as fs } from 'fs';
import wlogger from '../WinstonLogger';

interface Internals {
    connection: mongoose.Connection;
}

/**
 * @classdesc Handle all MongoDB operations.
 */
export default class MongooseDB extends DBClass {
    #Schemas: {
        User: mongoose.Model<Schemas.UserI>;
        Token: mongoose.Model<Schemas.Token>;
        Link: mongoose.Model<Schemas.Link>;
        PendingMember: mongoose.Model<Schemas.PendingMember>;
        Upload: mongoose.Model<Schemas.Upload>;
        AdminNotification: mongoose.Model<Schemas.AdminNotificationI>;
        Folderr: mongoose.Model<Schemas.FolderrDB>;
    };

    #internals: Internals;

    constructor() {
        super();

        this.#Schemas = {
            User: Schemas.User,
            Token: Schemas.JwtToken,
            Link: Schemas.Short,
            PendingMember: Schemas.VerifyingUser,
            Upload: Schemas.File,
            AdminNotification: Schemas.AdminNotifications,
            Folderr: Schemas.Folderr,
        };
        this.#internals = {
            connection: mongoose.connection,
        };
    }

    async init(url: string): Promise<void> {
        await mongoose.connect(url, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true } );
        this.#internals.connection.on('error', (err) => {
            if (process.env.NODE_ENV !== 'test') {
                wlogger.error(`[FATAL - DB] MongoDB connection fail!\n${err}\n[FATAL] Folderr is unable to work without a database! Folderr process terminated.`);
                process.exit(1);
            }
        } );
        this.#internals.connection.once('open', () => {
            this.fetchFolderr( {} ).then(r => r);
            wlogger.log('startup', '[SYSTEM - DB] Connected to MongoDB!');
        } );
    }

    async addFolderrBan(email: string): Promise<boolean> {
        const add = await this.#Schemas.Folderr.updateOne( {}, { $addToSet: { bans: email } } ).exec();
        return (add?.nModified > 0);
    }

    async removeFolderrBan(email: string): Promise<boolean> {
        const add = await this.#Schemas.Folderr.updateOne( {}, { $pull: { bans: email } } ).exec();
        return (add?.nModified > 0);
    }

    async fetchFolderr(query: Record<string, unknown>): Promise<Folderr> {
        const fldr = await this.#Schemas.Folderr.findOne(query).lean().exec();
        if (!fldr) {
            return this.createFolderr();
        }
        return fldr;
    }

    async createFolderr(): Promise<Folderr> {
        const fldr = new this.#Schemas.Folderr( { bans: [] } );
        await fldr.save();
        return fldr;
    }

    async makeOwner(username: string, password: string, userID: string, email: string): Promise<User | void> {
        const ownr = await this.findUser( { first: true }, 'first');
        if (ownr) {
            throw new Error('DB > FORBIDDEN - Owner already created!');
        }
        const user = new this.#Schemas.User( {
            first: true,
            admin: true,
            username,
            userID,
            email,
            password,
        } );
        await user.save();
        return user;
    }

    async findUser(query: Record<string, unknown>, selector?: string): Promise<User | null> {
        return selector ? this.#Schemas.User.findOne(query, selector).lean().exec() : this.#Schemas.User.findOne(query).lean().exec();
    }

    async findUsers(query: Record<string, unknown>, options?: { sort?: Record<string, unknown>; limit?: number; selector?: string } ): Promise<User[]> {
        const qoptions: { limit?: number; sort?: Record<string, unknown> } = {};
        if (options?.limit) {
            qoptions.limit = options.limit;
        }
        if (options?.sort) {
            qoptions.sort = options.sort;
        }
        return options ? this.#Schemas.User.find(query, options?.selector, qoptions).lean().exec() : this.#Schemas.User.find(query).lean().exec();
    }

    async findFullUser(queries: Record<string, unknown>[], selector?: { user?: string; file?: string; link?: string } ): Promise<{ account: User; files: Upload[]; links: Link[] } | undefined> {
        if (!queries || queries.length < 2 || queries.length > 2) {
            throw new Error(`MongooseDB > Input > findFullUser - Expected 2 queries in array but got ${!queries ? 'none' : queries.length}`);
        }
        const [
            account,
            files,
            links,
        ] = await Promise.all( [
            this.findUser(queries[0], (selector && selector.user) ),
            selector && selector.file ? this.#Schemas.Upload.find(queries[1], selector.file).lean().exec() : this.#Schemas.Upload.find(queries[1] ).lean().exec(),
            selector && selector.link ? this.#Schemas.Link.find(queries[1], selector.link).lean().exec() : this.#Schemas.Link.find(queries[1] ).lean().exec(),
        ] );
        if (!account) {
            return undefined;
        }
        return { account, files, links };
    }

    async findAndUpdateUser(query: Record<string, unknown>, update: Record<string, unknown>, selector?: string): Promise<User | null> {
        return selector ? this.#Schemas.User.findOneAndUpdate(query, update, { fields: selector, new: true } ).lean().exec() : this.#Schemas.User.findOneAndUpdate(query, update, { new: true } ).lean().exec();
    }

    async updateUser(query: Record<string, unknown>, update: Record<string, unknown>): Promise<boolean> {
        const upd = await this.#Schemas.User.updateOne(query, update).exec();
        return !!(upd?.nModified && upd.nModified > 0);
    }

    async makeUser(username: string, userID: string, password: string, email: string, options?: { admin?: boolean } ): Promise<User | undefined> {
        const cUser = await this.findUser( { username }, 'username');
        if (cUser) {
            return undefined;
        }
        const user = new this.#Schemas.User( {
            username, userID, password, admin: options && options.admin, email,
        } );
        await user.save();
        return user;
    }

    async purgeUser(userID: string): Promise<{ account: boolean; links: boolean }> {
        const [account, links] = await Promise.all( [this.#Schemas.User.deleteOne( { userID } ).exec(), this.#Schemas.Link.deleteMany( { owner: userID } ).exec()] );

        return { account: !!(account?.deletedCount && account?.deletedCount > 0), links: !!(links?.deletedCount && links?.deletedCount > 0) };
    }

    async findVerify(query: Record<string, unknown>): Promise<PendingMember | null> {
        return this.#Schemas.PendingMember.findOne(query).lean().exec();
    }

    async findVerifies(query: Record<string, unknown>): Promise<PendingMember[]> {
        return this.#Schemas.PendingMember.find(query).lean().exec();
    }

    async verifyUser(userID: string, options?: { admin?: boolean } ): Promise<User | undefined> {
        const verify = await this.#Schemas.PendingMember.findOneAndDelete( { userID } ).lean().exec();
        if (!verify) {
            return undefined;
        }
        const reg = new RegExp(userID);
        await this.#Schemas.AdminNotification.deleteOne( { notify: reg } ).lean().exec();
        // eslint-disable-next-line consistent-return
        return this.makeUser(verify.username, verify.userID, verify.password, verify.email, options);
    }

    async verifySelf(userID: string): Promise<User | undefined> {
        const verify = await this.#Schemas.PendingMember.findOneAndDelete( { userID } ).lean().exec();
        if (!verify) {
            return undefined;
        }
        return this.makeUser(verify.username, verify.userID, verify.password, verify.email);
    }

    async denyUser(userID: string): Promise<boolean> {
        const reg = new RegExp(userID);
        await this.#Schemas.AdminNotification.deleteOne( { notify: reg } ).lean().exec();
        const del = await this.#Schemas.PendingMember.deleteOne( { userID } ).lean().exec();
        return !!(del?.deletedCount && del.deletedCount > 0);
    }

    async denySelf(userID: string): Promise<boolean> {
        const del = await this.#Schemas.PendingMember.deleteOne( { userID } ).lean().exec();
        return !!(del?.deletedCount && del.deletedCount > 0);
    }

    async makeVerify(userID: string, username: string, password: string, validationToken: string, email: string): Promise<PendingMember> {
        const verify = new this.#Schemas.PendingMember( {
            userID, username, password, validationToken, email,
        } );
        await verify.save();
        return verify;
    }

    async findFile(query: Record<string, unknown>, selector?: string): Promise<Upload | null> {
        return selector ? this.#Schemas.Upload.findOne(query, selector).lean().exec() : this.#Schemas.Upload.findOne(query).lean().exec();
    }

    async findAndDeleteFile(query: Record<string, unknown>): Promise<Upload | null> {
        return this.#Schemas.Upload.findOneAndDelete(query).lean().exec();
    }

    async findFiles(query: Record<string, unknown>, options?: { limit?: number; selector?: string; sort?: Record<string, unknown> } ): Promise<Upload[]> {
        const qoptions: { limit?: number; sort?: Record<string, unknown> } = {};
        if (options?.limit) {
            qoptions.limit = options.limit;
        }
        if (options?.sort) {
            qoptions.sort = options.sort;
        }
        return this.#Schemas.Upload.find(query, options?.selector, qoptions).lean().exec();
    }

    async updateFile(query: Record<string, unknown>, update: Record<string, unknown>): Promise<boolean | undefined> {
        const upd = await this.#Schemas.Upload.updateOne(query, update).exec();
        if (upd?.nModified && upd.nModified > 0) {
            return true;
        }
        return undefined;
    }

    async makeFile(id: string, owner: string, path: string, type: string): Promise<Upload> {
        const file = new this.#Schemas.Upload( { ID: id, owner, path, type } );
        await file.save();
        return file;
    }

    async purgeFile(query: Record<string, unknown>): Promise<boolean> {
        const file = await this.#Schemas.Upload.findOneAndDelete(query, { projection: 'path' } ).lean().exec();
        if (!file) {
            return false;
        }
        if (existsSync(file.path) ) {
            try {
                await fs.unlink(file.path);
            } catch (e) {
                wlogger.error(`Database could not delete file ${file.path}. See error below.\nError: ${e.message || e}\n`);
            }
        }
        return true;
    }

    async findLink(query: Record<string, unknown>, selector?: string): Promise<Link | null> {
        return selector ? this.#Schemas.Link.findOne(query, selector).lean().exec() : this.#Schemas.Link.findOne(query).lean().exec();
    }

    async findAndDeleteLink(query: Record<string, unknown>): Promise<Link | null> {
        return this.#Schemas.Link.findOneAndDelete(query).lean().exec();
    }

    async findLinks(query: Record<string, unknown>, options?: { limit?: number; selector?: string; sort?: Record<string, unknown> } ): Promise<Link[]> {
        const qoptions: { limit?: number; sort?: Record<string, unknown> } = {};
        if (options?.limit) {
            qoptions.limit = options.limit;
        }
        if (options?.sort) {
            qoptions.sort = options.sort;
        }
        return this.#Schemas.Link.find(query, options?.selector, qoptions).lean();
    }

    async updateLink(query: Record<string, unknown>, update: Record<string, unknown>): Promise<boolean> {
        const out = await this.#Schemas.Upload.updateOne(query, update).exec();
        return !!(out?.nModified && out.nModified > 0);
    }

    async makeLink(id: string, owner: string, link: string): Promise<Link> {
        const link1 = new this.#Schemas.Link( { ID: id, owner, link } );
        await link1.save();
        return link1;
    }

    async purgeLink(query: Record<string, unknown>): Promise<boolean> {
        const del = await this.#Schemas.Link.deleteOne(query).exec();
        return !!(del?.deletedCount && del.deletedCount > 0);
    }

    async findToken(tokenID: string, userID: string, options?: { web?: boolean } ): Promise<TokenDB | null> {
        return this.#Schemas.Token.findOne( { id: tokenID, userID, web: (options && options.web) || false } ).lean<TokenDB>().exec();
    }

    async findTokens(userID: string, options?: { web?: boolean } ): Promise<TokenDB[]> {
        return this.#Schemas.Token.find( { userID, web: (options && options.web) || false } ).lean<TokenDB[]>().exec();
    }

    async makeToken(tokenID: string, userID: string, options?: { web?: boolean } ): Promise<TokenDB | undefined> {
        const tken = new this.#Schemas.Token( { id: tokenID, userID, web: (options && options.web) || false } );
        await tken.save();
        return tken;
    }

    async purgeToken(tokenID: string, userID: string, options?: { web?: boolean } ): Promise<boolean> {
        const del = await this.#Schemas.Token.deleteOne( { id: tokenID, userID, web: (options && options.web) } ).exec();
        return !!(del?.deletedCount && del.deletedCount > 0);
    }

    async purgeTokens(userID: string, web?: boolean): Promise<number | undefined> {
        const del = typeof web !== 'undefined' ? await this.#Schemas.Token.deleteMany( { userID, web } ).exec() : await this.#Schemas.Token.deleteMany( { userID } ).exec();
        return del.n;
    }

    async makeAdminNotify(id: string, notify: string, title: string): Promise<Notification> {
        const notif = new this.#Schemas.AdminNotification( { ID: id, notify, title } );
        await notif.save();
        return notif;
    }

    async findAdminNotify(query: Record<string, unknown>): Promise<Notification | null> {
        return this.#Schemas.AdminNotification.findOne(query).lean().exec();
    }

    async findAdminNotifies(query: Record<string, unknown>): Promise<Notification[]> {
        return this.#Schemas.AdminNotification.find(query).lean().exec();
    }

    async purgeAdminNotify(query: Record<string, unknown>): Promise<boolean> {
        const del = await this.#Schemas.AdminNotification.deleteOne(query).exec();
        return !!(del?.deletedCount && del.deletedCount > 0);
    }

    async shutdown(): Promise<void> {
        return this.#internals.connection.close();
    }
}
