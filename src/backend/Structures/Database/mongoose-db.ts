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

import { existsSync, promises as fs } from "fs";
import mongoose from "mongoose";
import process from "process";
import * as Schemas from "../../Schemas/index.js";
import * as constants from "../constants/index.js";
import logger from "../logger.js";
import { uploadPath } from "../Utilities/upload-types.js";
import type {
	Ban,
	FileFilter,
	Folderr,
	Link,
	LinkFilter,
	Notification,
	PageOptions,
	PendingMember,
	Statistics,
	Tokendb,
	Upload,
	User,
	UserFilter,
} from "./db-class";
import { DBClass } from "./db-class.js";

// Strength 2 compares letters without case, so Bob@x.com matches bob@x.com.
// The email indexes in Schemas/ use the same collation, so these lookups can use them
const EMAIL_COLLATION = { locale: "en", strength: 2 };

/**
 * Mongo's version of a page. With only `after`, the items just after it are read oldest first and
 * then reversed, so a newest-first page doesn't jump past them to the very newest items
 */
function toMongoPage(page: PageOptions) {
	const createdAt: { $lt?: Date; $gt?: Date } = {};
	if (page.before) createdAt.$lt = page.before;
	if (page.after) createdAt.$gt = page.after;
	const reverse = Boolean(page.after && !page.before && !page.ascending);
	return {
		filter: page.before || page.after ? { createdAt } : {},
		sort: { createdAt: page.ascending || reverse ? 1 : -1 } as const,
		reverse,
	};
}

/**
 * @classdesc Handle all MongoDB operations.
 */
export default class Mongoosedb extends DBClass {
	readonly #schemas: {
		User: mongoose.Model<User>;
		Token: mongoose.Model<Tokendb>;
		Link: mongoose.Model<Link>;
		PendingMember: mongoose.Model<PendingMember>;
		Upload: mongoose.Model<Upload>;
		AdminNotification: mongoose.Model<Notification>;
		Folderr: mongoose.Model<Folderr>;
		Ban: mongoose.Model<Ban>;
	};

	readonly #internals: {
		connection: mongoose.Connection;
	};

	constructor() {
		super();

		this.status = "offline";
		this.#schemas = {
			User: Schemas.User,
			Token: Schemas.JwtToken,
			Link: Schemas.Short,
			PendingMember: Schemas.VerifyingUser,
			Upload: Schemas.File,
			AdminNotification: Schemas.AdminNotifications,
			Folderr: Schemas.Folderr,
			Ban: Schemas.Ban,
		};
		this.#internals = {
			connection: mongoose.connection,
		};
	}

	async init(url: string): Promise<void> {
		try {
			await mongoose.connect(url, { appName: "Folderr" });
			this.#internals.connection = mongoose.connection;
			this.status = "ok";
			// Ensure all indexes for hopefully proper (and faster) sorting
			logger.debug("DB - Ensuring Indexes");
			await this.#schemas.User.ensureIndexes();
			await this.#schemas.Token.ensureIndexes();
			await this.#schemas.Link.ensureIndexes();
			await this.#schemas.PendingMember.ensureIndexes();
			await this.#schemas.Upload.ensureIndexes();
			await this.#schemas.AdminNotification.ensureIndexes();
			await this.#schemas.Folderr.ensureIndexes();
			await this.#schemas.Ban.ensureIndexes();
			logger.debug("DB - Indexes ensured");
			await this.fetchFolderr(); // Neglecting this potential error to handle elsewhere
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (
					error.message.startsWith("Folderr DB Entry Not Found") &&
					!process.env.setup
				) {
					logger.error(
						"[FATAL - DB] MongoDB connection error!\n" +
							error.message +
							"\n[FATAL] Folderr is unable to work without a database!" +
							"\nFolderr process terminated.",
					);
					process.exit(1);
				}
			} else {
				logger.error(
					"[FATAL - DB] MongoDB connection error!" +
						"\n[FATAL] Folderr is unable to work without a database!" +
						"\nFolderr process terminated.",
				);
				process.exit(1);
			}
		}

		this.#internals.connection.on("error", (error: Error) => {
			if (process.env.NODE_ENV !== "test") {
				logger.error(
					"[FATAL - DB] MongoDB connection error!\n" +
						error.message +
						"\n[FATAL] Folderr is unable to work without a database!" +
						"\nFolderr process terminated.",
				);
				process.exit(1);
			}
		});
		this.#internals.connection.on("disconnect", async () => {
			try {
				await mongoose.connect(url);
			} catch (error: unknown) {
				if (error instanceof Error) {
					this.status = "offline";
					logger.error(
						"[FATAL - DB] MongoDB connection error!\n" +
							error.message +
							"\n[FATAL] Folderr is unable to work without a database!" +
							"\nFolderr process terminated.",
					);
					process.exit(1);
				}

				logger.fatal("Folderr is unable to work without a database!");
				logger.info("Folderr process terminated");
				process.exit(1);
			}
		});
	}

	/* ---- FOLDERR RELATED METHODS ---- */
	async addBan(email: string, id: string, reason: string): Promise<Ban> {
		const ban = new this.#schemas.Ban({ email, id, reason });
		await ban.save();
		return ban;
	}

	async getBans(): Promise<Ban[]> {
		return this.#schemas.Ban.find({}).exec();
	}

	async removeBan(email: string): Promise<number> {
		const remove = await this.#schemas.Ban.deleteOne({ email })
			.collation(EMAIL_COLLATION)
			.exec();
		return remove.deletedCount;
	}

	async isBanned(email: string): Promise<boolean> {
		const ban = await this.#schemas.Ban.exists({ email })
			.collation(EMAIL_COLLATION)
			.exec();
		return Boolean(ban);
	}

	async fetchFolderr(): Promise<Folderr> {
		const fldr = await this.#schemas.Folderr.findOne({}).lean().exec();
		if (!fldr) {
			throw new Error(
				"Folderr DB entry not found, Folderr DB entry is required.",
			);
		}

		return fldr;
	}

	async createFolderr(publicKeyJWT: Buffer): Promise<Folderr> {
		const fldrr = await this.#schemas.Folderr.findOne({});
		if (fldrr) {
			fldrr.publicKeyJWT = publicKeyJWT;
			await fldrr.save();

			return fldrr;
		}

		const fldr = new this.#schemas.Folderr({ publicKeyJWT });
		await fldr.save();
		return fldr;
	}

	async makeOwner(
		username: string,
		password: string,
		id: string,
		email: string,
	): Promise<User | undefined> {
		const ownr = await this.findUser({ owner: true }, "owner");
		if (ownr) {
			throw new Error("DB > FORBIDDEN - Owner already created!");
		}

		const user = new this.#schemas.User({
			owner: true,
			admin: true,
			username,
			id,
			email,
			password,
		});
		await user.save();
		return user;
	}

	async statistics(): Promise<Statistics> {
		const users = await this.#schemas.User.countDocuments({}).exec();
		const files = await this.#schemas.Upload.countDocuments({}).exec();
		const links = await this.#schemas.Link.countDocuments({}).exec();
		const bannedEmails = await this.#schemas.Ban.countDocuments({}).exec();
		return { users, files, links, bannedEmails, whitelistedEmails: 0 };
	}

	/* ---- USER RELATED METHODS ---- */
	async findUser(
		filter: UserFilter,
		selector?: string,
	): Promise<User | undefined> {
		const query = this.#schemas.User.findOne(filter, selector);
		if ("email" in filter) {
			query.collation(EMAIL_COLLATION);
		}

		return (await query.lean().exec()) ?? undefined;
	}

	async isUsernameTaken(username: string): Promise<boolean> {
		const [user, signup] = await Promise.all([
			this.#schemas.User.exists({ username }).exec(),
			this.#schemas.PendingMember.exists({ username }).exec(),
		]);
		return Boolean(user ?? signup);
	}

	async isEmailTaken(email: string): Promise<boolean> {
		const [user, signup] = await Promise.all([
			this.#schemas.User.exists({
				$or: [{ email }, { pendingEmail: email }],
			})
				.collation(EMAIL_COLLATION)
				.exec(),
			this.#schemas.PendingMember.exists({ email })
				.collation(EMAIL_COLLATION)
				.exec(),
		]);
		return Boolean(user ?? signup);
	}

	async listUsers(page: PageOptions): Promise<User[]> {
		const { filter, sort, reverse } = toMongoPage(page);
		const users = await this.#schemas.User.find(filter)
			.sort(sort)
			.limit(page.limit)
			.lean()
			.exec();
		return reverse ? users.reverse() : users;
	}

	async setAdmin(id: string, admin: boolean): Promise<User | undefined> {
		// Only matches a user that isn't the owner and doesn't already have this setting
		return (
			(await this.#schemas.User.findOneAndUpdate(
				{ id, owner: { $ne: true }, admin: { $ne: admin } },
				{ admin },
				{ new: true },
			)
				.lean()
				.exec()) ?? undefined
		);
	}

	async updateUser(
		id: string,
		fields: Partial<
			Pick<
				User,
				| "username"
				| "password"
				| "privacy"
				| "pendingEmail"
				| "pendingEmailToken"
				| "tokenExpiresAt"
			>
		>,
	): Promise<boolean> {
		const upd = await this.#schemas.User.updateOne({ id }, fields);
		return Boolean(upd?.modifiedCount && upd.modifiedCount > 0);
	}

	async addNotification(
		userID: string,
		notification: Pick<Notification, "id" | "title" | "notify">,
	): Promise<boolean | undefined> {
		const upd = await this.#schemas.User.updateOne(
			{ id: userID },
			{
				$addToSet: {
					notifs: {
						id: notification.id,
						title: notification.title,
						notify: notification.notify,
						createdAt: Date.now(),
					},
				},
			},
		);

		return Boolean(upd.modifiedCount && upd.modifiedCount > 0);
	}

	async removeNotification(
		userID: string,
		id: string,
	): Promise<boolean | undefined> {
		const upd = await this.#schemas.User.updateOne(
			{ id: userID },
			{
				$pull: {
					notifs: {
						id,
					},
				},
			},
		);

		return Boolean(upd.modifiedCount && upd.modifiedCount > 0);
	}

	async clearNotifications(userID: string): Promise<boolean | undefined> {
		const upd = await this.#schemas.User.updateOne(
			{ id: userID },
			{
				$pull: {
					notifs: {
						title: { $ne: constants.WARNING_TITLE },
					},
				},
			},
		);

		return Boolean(upd.modifiedCount && upd.modifiedCount > 0);
	}

	async makeUser(
		userInfo: {
			username: string;
			id: string;
			password: string;
			email: string;
		},
		options?: {
			admin?: boolean;
		},
	): Promise<User | undefined> {
		const cUser = await this.findUser(
			{ username: userInfo.username },
			"username",
		);
		if (cUser) {
			return undefined;
		}

		const user = new this.#schemas.User({
			username: userInfo.username,
			id: userInfo.id,
			password: userInfo.password,
			admin: options?.admin,
			email: userInfo.email,
		});
		await user.save();
		return user;
	}

	async markUserForDeletion(id: string): Promise<boolean> {
		const account = await this.#schemas.User.updateOne(
			{ id },
			{ $set: { markedForDeletion: true } },
		);

		return account.modifiedCount === 1;
	}

	async purgeUser(id: string): Promise<{ account: boolean; links: boolean }> {
		const [account, links] = await Promise.all([
			this.#schemas.User.deleteOne({ id }).exec(),
			this.#schemas.Link.deleteMany({ owner: id }).exec(),
		]);

		return {
			account: Boolean(
				account?.deletedCount && account?.deletedCount > 0,
			),
			links: Boolean(links?.deletedCount && links?.deletedCount > 0),
		};
	}

	async addMirror(userID: string, url: string): Promise<boolean | undefined> {
		const upd = await this.#schemas.User.updateOne(
			{ id: userID },
			{
				$addToSet: {
					cURLs: url,
				},
			},
		);

		return Boolean(upd.modifiedCount && upd.modifiedCount > 0);
	}

	async removeMirror(
		userID: string,
		url: string,
	): Promise<boolean | undefined> {
		const upd = await this.#schemas.User.updateOne(
			{ id: userID },
			{
				$pull: {
					cURLs: url,
				},
			},
		);

		return Boolean(upd.modifiedCount && upd.modifiedCount > 0);
	}

	async adjustUserCounts(
		id: string,
		update: { files?: number; links?: number },
	): Promise<boolean | undefined> {
		if (!update.files && !update.links) {
			throw new Error(
				"DB > adjustUserCounts - Need to either change the link or file count!",
			);
		}
		const updateQuery: {
			$inc: { files?: number; links?: number };
		} = { $inc: {} };

		if (update.files) updateQuery.$inc.files = update.files;
		if (update.links) updateQuery.$inc.links = update.links;

		const upd = await this.#schemas.User.updateOne(
			{ id },
			updateQuery,
		).exec();
		return Boolean(upd.modifiedCount && upd.modifiedCount > 0);
	}

	async findVerify(id: string): Promise<PendingMember | undefined> {
		return (
			(await this.#schemas.PendingMember.findOne({ id }).lean().exec()) ??
			undefined
		);
	}

	async listVerifies(): Promise<PendingMember[]> {
		return this.#schemas.PendingMember.find({})
			.sort({ createdAt: 1 })
			.lean()
			.exec();
	}

	async verifyUser(
		id: string,
		options?: { admin?: boolean },
	): Promise<User | undefined> {
		const verify = await this.#schemas.PendingMember.findOneAndDelete({
			id,
		})
			.lean()
			.exec();
		if (!verify) {
			return undefined;
		}

		const reg = new RegExp(id);
		await this.#schemas.AdminNotification.deleteOne({ notify: reg }).exec();

		return this.makeUser(
			{
				username: verify.username,
				id: verify.id,
				password: verify.password,
				email: verify.email,
			},
			options,
		);
	}

	async verifySelf(id: string): Promise<User | undefined> {
		const verify = await this.#schemas.PendingMember.findOneAndDelete({
			id,
		})
			.lean()
			.exec();
		if (!verify) {
			return undefined;
		}

		return this.makeUser({
			username: verify.username,
			id: verify.id,
			password: verify.password,
			email: verify.email,
		});
	}

	async denyUser(id: string): Promise<boolean> {
		const reg = new RegExp(id);
		await this.#schemas.AdminNotification.deleteOne({ notify: reg }).exec();
		const del = await this.#schemas.PendingMember.deleteOne({ id }).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	async denySelf(id: string): Promise<boolean> {
		const del = await this.#schemas.PendingMember.deleteOne({ id }).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	async makeVerify(
		userInfo: {
			username: string;
			id: string;
			password: string;
			email: string;
		},
		validationToken: string,
	): Promise<PendingMember> {
		const verify = new this.#schemas.PendingMember({
			id: userInfo.id,
			username: userInfo.username,
			password: userInfo.password,
			validationToken,
			email: userInfo.email,
		});
		await verify.save();
		return verify;
	}

	/* ---- FILE RELATED METHODS ---- */
	async findFile(
		filter: FileFilter,
		selector?: string,
	): Promise<Upload | undefined> {
		return (
			(await this.#schemas.Upload.findOne(filter, selector)
				.lean()
				.exec()) ?? undefined
		);
	}

	async listFiles(owner: string, page: PageOptions): Promise<Upload[]> {
		const { filter, sort, reverse } = toMongoPage(page);
		const files = await this.#schemas.Upload.find({ owner, ...filter })
			.sort(sort)
			.limit(page.limit)
			.lean()
			.exec();
		return reverse ? files.reverse() : files;
	}

	async makeFile(
		id: string,
		owner: string,
		fields: { contentType: string; ext: string },
	): Promise<Upload> {
		const file = new this.#schemas.Upload({
			id,
			owner,
			contentType: fields.contentType,
			ext: fields.ext,
		});
		await file.save();
		return file;
	}

	/**
	 * Deletes a file from the database and the disk.
	 * If deleting files en masse, use db.purgeFilesByIds
	 * @param filter What file to remove
	 * @returns Whether or not the file was deleted
	 */
	async purgeFile(filter: FileFilter): Promise<boolean> {
		const file = await this.#schemas.Upload.findOneAndDelete(filter, {
			projection: "id ext",
		})
			.lean()
			.exec();
		if (!file) {
			return false;
		}

		const path = uploadPath(file.id, file.ext);
		if (existsSync(path)) {
			try {
				await fs.unlink(path);
			} catch (error: unknown) {
				if (error instanceof Error) {
					logger.error(
						`Database could not delete file ${path}. See error below.\n` +
							`Error: ${error.message}`,
					);
				}

				logger.error(
					`Database could not delete file ${path}. Unknown Error`,
				);
			}
		}

		return true;
	}

	async purgeFilesByIds(owner: string, ids: string[]): Promise<number> {
		if (ids.length === 0) {
			return 0;
		}

		const files = await this.#schemas.Upload.deleteMany({
			owner,
			id: { $in: ids },
		}).exec();
		return files.deletedCount;
	}

	/* ---- LINK RELATED METHODS ---- */
	async findLink(
		filter: LinkFilter,
		selector?: string,
	): Promise<Link | undefined> {
		return (
			(await this.#schemas.Link.findOne(filter, selector)
				.lean()
				.exec()) ?? undefined
		);
	}

	async findAndDeleteLink(filter: LinkFilter): Promise<Link | undefined> {
		return (
			(await this.#schemas.Link.findOneAndDelete(filter).lean().exec()) ??
			undefined
		);
	}

	async listLinks(owner: string, page: PageOptions): Promise<Link[]> {
		const { filter, sort, reverse } = toMongoPage(page);
		const links = await this.#schemas.Link.find({ owner, ...filter })
			.sort(sort)
			.limit(page.limit)
			.lean()
			.exec();
		return reverse ? links.reverse() : links;
	}

	async makeLink(id: string, owner: string, link: string): Promise<Link> {
		const link1 = new this.#schemas.Link({ id, owner, link });
		await link1.save();
		return link1;
	}

	async purgeLink(filter: LinkFilter): Promise<boolean> {
		const del = await this.#schemas.Link.deleteOne(filter).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	/* ---- AUTHENTICATION RELATED METHODS ---- */
	async findToken(
		tokenID: string,
		userID: string,
		options?: {
			web?: boolean;
		},
	): Promise<Tokendb | undefined> {
		return (
			(await this.#schemas.Token.findOne({
				id: tokenID,
				userID,
				web: options?.web ?? false,
			})
				.lean<Tokendb>()
				.exec()) ?? undefined
		);
	}

	async findTokens(
		userID: string,
		options?: { web?: boolean },
	): Promise<Tokendb[]> {
		return this.#schemas.Token.find({
			userID,
			web: options?.web ?? false,
		})
			.lean<Tokendb[]>()
			.exec();
	}

	async makeToken(
		tokenID: string,
		userID: string,
		options?: {
			web?: boolean;
			description?: string;
		},
	): Promise<Tokendb | undefined> {
		const date = new Date();
		date.setDate(date.getDate() + 2 * 7);
		const tken = new this.#schemas.Token({
			id: tokenID,
			userID,
			web: options?.web ?? false,
			expireAt: options?.web ? date : undefined,
			description: options?.description,
		});
		await tken.save();
		return tken;
	}

	async purgeToken(
		tokenID: string,
		userID: string,
		options?: { web?: boolean },
	): Promise<boolean> {
		const del = await this.#schemas.Token.deleteOne({
			id: tokenID,
			userID,
			web: options?.web,
		}).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	async purgeTokens(
		userID: string,
		web?: boolean,
	): Promise<number | undefined> {
		const del = web
			? await this.#schemas.Token.deleteMany({ userID, web }).exec()
			: await this.#schemas.Token.deleteMany({ userID }).exec();
		return del.deletedCount;
	}

	/* ---- ADMIN RELATED METHODS ---- */
	async makeAdminNotify(
		id: string,
		notify: string,
		title: string,
	): Promise<Notification> {
		const notif = new this.#schemas.AdminNotification({
			id,
			notify,
			title,
		});
		await notif.save();
		return notif;
	}

	async findAdminNotify(id: string): Promise<Notification | undefined> {
		return (
			(await this.#schemas.AdminNotification.findOne({ id })
				.lean()
				.exec()) ?? undefined
		);
	}

	async listAdminNotifies(): Promise<Notification[]> {
		return this.#schemas.AdminNotification.find({})
			.sort({ createdAt: -1 })
			.lean()
			.exec();
	}

	async purgeAdminNotify(id: string): Promise<boolean> {
		const del = await this.#schemas.AdminNotification.deleteOne({
			id,
		}).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	/* ---- DATABBASE RELATED METHODS ---- */
	async shutdown(): Promise<void> {
		return this.#internals.connection.close();
	}
}
