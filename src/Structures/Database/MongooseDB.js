import DBClass from './DBClass';
import mongoose from 'mongoose';
import * as Schemas from '../../Schemas/index';
import { existsSync, promises as fs } from 'fs';
import { isMaster } from 'cluster';
export default class MongooseDB extends DBClass {
    constructor() {
        super();
        this.Schemas = {
            User: Schemas.User,
            Token: Schemas.JwtToken,
            Link: Schemas.Short,
            PendingMember: Schemas.VerifyingUser,
            Upload: Schemas.File,
            AdminNotification: Schemas.AdminNotifications,
            Folderr: Schemas.Folderr,
        };
    }
    async init(url, useSharder) {
        await mongoose.connect(url, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true });
        const db = mongoose.connection;
        db.on('error', (err) => {
            if (useSharder && !isMaster) {
                return;
            }
            if (process.env.NODE_ENV !== 'test') {
                console.log(`[FATAL - DB] MongoDB connection fail!\n${err}\n[FATAL] Folderr is unable to work without a database! Folderr process terminated.`);
                process.exit(1);
            }
        });
        db.once('open', () => {
            if (useSharder && !isMaster) {
                return;
            }
            this.fetchFolderr({}).then(r => r);
            console.log('[SYSTEM - DB] Connected to MongoDB!');
        });
    }
    async addFolderrBan(email) {
        const add = await this.Schemas.Folderr.updateOne({}, { $addToSet: { bans: email } }).exec();
        return ((add === null || add === void 0 ? void 0 : add.nModified) > 0);
    }
    async removeFolderrBan(email) {
        const add = await this.Schemas.Folderr.updateOne({}, { $pull: { bans: email } }).exec();
        return ((add === null || add === void 0 ? void 0 : add.nModified) > 0);
    }
    async fetchFolderr(query) {
        const fldr = await this.Schemas.Folderr.findOne(query).lean().exec();
        if (!fldr) {
            return this.createFolderr();
        }
        return fldr;
    }
    async createFolderr() {
        const fldr = new this.Schemas.Folderr({ bans: [] });
        await fldr.save();
        return fldr;
    }
    async makeOwner(username, password, userID, email) {
        const ownr = await this.findUser({ first: true }, 'first');
        if (ownr) {
            throw new Error('DB > FORBIDDEN - Owner already created!');
        }
        const user = new this.Schemas.User({
            first: true,
            admin: true,
            username,
            userID,
            email,
            password,
        });
        await user.save();
        return user;
    }
    async findUser(query, selector) {
        return selector ? this.Schemas.User.findOne(query, selector).lean().exec() : this.Schemas.User.findOne(query).lean().exec();
    }
    async findUsers(query, options) {
        const qoptions = {};
        if (options === null || options === void 0 ? void 0 : options.limit) {
            qoptions.limit = options.limit;
        }
        if (options === null || options === void 0 ? void 0 : options.sort) {
            qoptions.sort = options.sort;
        }
        return options ? this.Schemas.User.find(query, options === null || options === void 0 ? void 0 : options.selector, qoptions).lean().exec() : this.Schemas.User.find(query).lean().exec();
    }
    async findFullUser(queries, selector) {
        if (!queries || queries.length < 2 || queries.length > 2) {
            throw new Error(`MongooseDB > Input > findFullUser - Expected 2 queries in array but got ${!queries ? 'none' : queries.length}`);
        }
        const [account, files, links,] = await Promise.all([
            this.findUser(queries[0], (selector && selector.user)),
            selector && selector.file ? this.Schemas.Upload.find(queries[1], selector.file).lean().exec() : this.Schemas.Upload.find(queries[1]).lean().exec(),
            selector && selector.link ? this.Schemas.Link.find(queries[1], selector.link).lean().exec() : this.Schemas.Link.find(queries[1]).lean().exec(),
        ]);
        if (!account) {
            return undefined;
        }
        return { account, files, links };
    }
    async findAndUpdateUser(query, update, selector) {
        return selector ? this.Schemas.User.findOneAndUpdate(query, update, { fields: selector, new: true }).lean().exec() : this.Schemas.User.findOneAndUpdate(query, update, { new: true }).lean().exec();
    }
    async updateUser(query, update) {
        const upd = await this.Schemas.User.updateOne(query, update).lean().exec();
        return !!((upd === null || upd === void 0 ? void 0 : upd.nModified) && upd.nModified > 0);
    }
    async makeUser(username, userID, password, email, options) {
        const cUser = await this.findUser({ username }, 'username');
        if (cUser) {
            return undefined;
        }
        const user = new this.Schemas.User({
            username, userID, password, admin: options && options.admin, email,
        });
        await user.save();
        return user;
    }
    async purgeUser(userID) {
        const [account, links] = await Promise.all([this.Schemas.User.deleteOne({ userID }).exec(), this.Schemas.Link.deleteMany({ owner: userID }).exec()]);
        return { account: !!((account === null || account === void 0 ? void 0 : account.deletedCount) && (account === null || account === void 0 ? void 0 : account.deletedCount) > 0), links: !!((links === null || links === void 0 ? void 0 : links.deletedCount) && (links === null || links === void 0 ? void 0 : links.deletedCount) > 0) };
    }
    async findVerify(query) {
        return this.Schemas.PendingMember.findOne(query).lean().exec();
    }
    async findVerifies(query) {
        return this.Schemas.PendingMember.find(query).lean().exec();
    }
    async verifyUser(userID, options) {
        const verify = await this.Schemas.PendingMember.findOneAndDelete({ userID }).lean().exec();
        if (!verify) {
            return undefined;
        }
        const reg = new RegExp(userID);
        await this.Schemas.AdminNotification.deleteOne({ notify: reg }).lean().exec();
        // eslint-disable-next-line consistent-return
        return this.makeUser(verify.username, verify.userID, verify.password, verify.email, options);
    }
    async verifySelf(userID) {
        const verify = await this.Schemas.PendingMember.findOneAndDelete({ userID }).lean().exec();
        if (!verify) {
            return undefined;
        }
        return this.makeUser(verify.username, verify.userID, verify.password, verify.email);
    }
    async denyUser(userID) {
        const reg = new RegExp(userID);
        await this.Schemas.AdminNotification.deleteOne({ notify: reg }).lean().exec();
        const del = await this.Schemas.PendingMember.deleteOne({ userID }).lean().exec();
        return !!((del === null || del === void 0 ? void 0 : del.deletedCount) && del.deletedCount > 0);
    }
    async denySelf(userID) {
        const del = await this.Schemas.PendingMember.deleteOne({ userID }).lean().exec();
        return !!((del === null || del === void 0 ? void 0 : del.deletedCount) && del.deletedCount > 0);
    }
    async makeVerify(userID, username, password, validationToken, email) {
        const verify = new this.Schemas.PendingMember({
            userID, username, password, validationToken, email,
        });
        await verify.save();
        return verify;
    }
    async findFile(query, selector) {
        return selector ? this.Schemas.Upload.findOne(query, selector).lean().exec() : this.Schemas.Upload.findOne(query).lean().exec();
    }
    async findAndDeleteFile(query) {
        return this.Schemas.Upload.findOneAndDelete(query).lean().exec();
    }
    async findFiles(query, options) {
        const qoptions = {};
        if (options === null || options === void 0 ? void 0 : options.limit) {
            qoptions.limit = options.limit;
        }
        if (options === null || options === void 0 ? void 0 : options.sort) {
            qoptions.sort = options.sort;
        }
        return this.Schemas.Upload.find(query, options === null || options === void 0 ? void 0 : options.selector, qoptions).lean().exec();
    }
    async updateFile(query, update) {
        const upd = await this.Schemas.Upload.updateOne(query, update);
        if ((upd === null || upd === void 0 ? void 0 : upd.nModified) && upd.nModified > 0) {
            return true;
        }
        return undefined;
    }
    async makeFile(id, owner, path, type) {
        const file = new this.Schemas.Upload({ ID: id, owner, path, type });
        await file.save();
        return file;
    }
    async purgeFile(query) {
        const file = await this.Schemas.Upload.findOneAndDelete(query, { projection: 'path' }).lean().exec();
        if (!file) {
            return false;
        }
        if (existsSync(file.path)) {
            try {
                await fs.unlink(file.path);
            }
            catch (e) {
                console.log(`Database could not delete file ${file.path}. See error below.\nError: ${e.message || e}\n`);
            }
        }
        return true;
    }
    async findLink(query, selector) {
        return selector ? this.Schemas.Link.findOne(query, selector).lean().exec() : this.Schemas.Link.findOne(query).lean().exec();
    }
    async findAndDeleteLink(query) {
        return this.Schemas.Link.findOneAndDelete(query).lean().exec();
    }
    async findLinks(query, options) {
        const qoptions = {};
        if (options === null || options === void 0 ? void 0 : options.limit) {
            qoptions.limit = options.limit;
        }
        if (options === null || options === void 0 ? void 0 : options.sort) {
            qoptions.sort = options.sort;
        }
        return this.Schemas.Link.find(query, options === null || options === void 0 ? void 0 : options.selector, qoptions).lean();
    }
    async updateLink(query, update) {
        return this.Schemas.Upload.updateOne(query, update);
    }
    async makeLink(id, owner, link) {
        const link1 = new this.Schemas.Link({ ID: id, owner, link });
        await link1.save();
        return link1;
    }
    async purgeLink(query) {
        const del = await this.Schemas.Link.deleteOne(query).exec();
        return !!((del === null || del === void 0 ? void 0 : del.deletedCount) && del.deletedCount > 0);
    }
    async findToken(tokenID, userID, options) {
        return this.Schemas.Token.findOne({ id: tokenID, userID, web: (options && options.web) || false }).lean().exec();
    }
    async findTokens(userID, options) {
        return this.Schemas.Token.find({ userID, web: (options && options.web) || false }).lean().exec();
    }
    async makeToken(tokenID, userID, options) {
        const tken = new this.Schemas.Token({ id: tokenID, userID, web: (options && options.web) || false });
        await tken.save();
        return tken;
    }
    async purgeToken(tokenID, userID, options) {
        const del = await this.Schemas.Token.deleteOne({ id: tokenID, userID, web: (options && options.web) }).exec();
        return !!((del === null || del === void 0 ? void 0 : del.deletedCount) && del.deletedCount > 0);
    }
    async purgeTokens(userID, web) {
        const del = typeof web !== 'undefined' ? await this.Schemas.Token.deleteMany({ userID, web }).exec() : await this.Schemas.Token.deleteMany({ userID }).exec();
        return del.n;
    }
    async makeAdminNotify(id, notify, title) {
        const notif = new this.Schemas.AdminNotification({ ID: id, notify, title });
        await notif.save();
        return notif;
    }
    async findAdminNotify(query) {
        return this.Schemas.AdminNotification.findOne(query).lean().exec();
    }
    async findAdminNotifies(query) {
        return this.Schemas.AdminNotification.find(query).lean().exec();
    }
    async purgeAdminNotify(query) {
        const del = await this.Schemas.AdminNotification.deleteOne(query).exec();
        return !!((del === null || del === void 0 ? void 0 : del.deletedCount) && del.deletedCount > 0);
    }
}
