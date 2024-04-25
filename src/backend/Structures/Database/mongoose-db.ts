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
import process from "process";
import mongoose from "mongoose";
import * as Schemas from "../../Schemas/index";
import logger from "../logger";
import * as constants from "../constants/index";
import type {
	User,
	Tokendb,
	Link,
	PendingMember,
	Upload,
	Notification,
	Folderr,
	Statistics,
	Ban,
} from "./db-class";
import { DBClass } from "./db-class";

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
			/* eslint-disable @typescript-eslint/naming-convention */
			User: Schemas.User,
			Token: Schemas.JwtToken,
			Link: Schemas.Short,
			PendingMember: Schemas.VerifyingUser,
			Upload: Schemas.File,
			AdminNotification: Schemas.AdminNotifications,
			Folderr: Schemas.Folderr,
			Ban: Schemas.Ban,
			/* eslint-enable @typescript-eslint/naming-convention */
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
			await this.fetchFolderr({}); // Neglecting this potential error to handle elsewhere
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
							"\nFolderr process terminated."
					);
					process.exit(1);
				}
			} else {
				logger.error(
					"[FATAL - DB] MongoDB connection error!" +
						"\n[FATAL] Folderr is unable to work without a database!" +
						"\nFolderr process terminated."
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
						"\nFolderr process terminated."
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
							"\nFolderr process terminated."
					);
					process.exit(1);
				}

				logger.fatal("Folderr is unable to work without a database!");
				logger.info("Folderr process terminated");
				process.exit(1);
			}
		});
		/* eslint-enable unicorn/no-process-exit */
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

	async removeBan(email: string): Promise<boolean> {
		const remove = await this.#schemas.Ban.deleteOne({ email }).exec();
		return remove.acknowledged ?? remove.deletedCount > 0;
	}

	async fetchFolderr(query?: Record<string, unknown>): Promise<Folderr> {
		const fldr = await this.#schemas.Folderr.findOne(query).lean().exec();
		if (!fldr) {
			throw new Error(
				"Folderr DB entry not found, Folderr DB entry is required."
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

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const fldr = new this.#schemas.Folderr({ bans: [], publicKeyJWT });
		await fldr.save();
		return fldr;
	}

	async makeOwner(
		username: string,
		password: string,
		id: string,
		email: string
	): Promise<User | void> {
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
		query: Record<string, unknown>,
		selector?: string
	): Promise<User | undefined> {
		return (
			(selector
				? await this.#schemas.User.findOne(query, selector)
						.lean()
						.exec()
				: await this.#schemas.User.findOne(query).lean().exec()) ??
			undefined
		);
	}

	async findUsers(
		query: Record<string, unknown>,
		options?: {
			sort?: Record<string, unknown>;
			limit?: number;
			selector?: string;
		}
	): Promise<User[]> {
		const qoptions: { limit?: number; sort?: Record<string, unknown> } = {};
		if (options?.limit) {
			qoptions.limit = options.limit;
		}

		if (options?.sort) {
			qoptions.sort = options.sort;
		}

		return options
			? this.#schemas.User.find(query, options?.selector, qoptions)
					.sort({ createdAt: 1 })
					.lean()
					.exec()
			: this.#schemas.User.find(query)
					.sort({ createdAt: 1 })
					.lean()
					.exec();
	}

	async findFullUser(
		queries: Array<Record<string, unknown>>,
		selector?: {
			user?: string;
			file?: string;
			link?: string;
		}
	): Promise<{ account: User; files: Upload[]; links: Link[] } | undefined> {
		if (!queries || queries.length < 2 || queries.length > 2) {
			throw new Error(
				constants.TEMPLATES.MONGOOSE.expected_queries(
					2,
					queries?.length
				)
			);
		}

		const [account, files, links] = await Promise.all([
			this.findUser(queries[0], selector?.user),
			selector?.file
				? this.#schemas.Upload.find(queries[1], selector.file)
						.lean()
						.exec()
				: this.#schemas.Upload.find(queries[1]).lean().exec(),
			selector?.link
				? this.#schemas.Link.find(queries[1], selector.link)
						.lean()
						.exec()
				: this.#schemas.Link.find(queries[1]).lean().exec(),
		]);
		if (!account) {
			return undefined;
		}

		return { account, files, links };
	} /* eslint-enable unicorn/no-array-callback-reference */

	async findAndUpdateUser(
		query: Record<string, unknown>,
		update: Record<string, unknown>,
		selector?: string
	): Promise<User | undefined> {
		if (selector) {
			return (
				(await this.#schemas.User.findOneAndUpdate(query, update, {
					fields: selector,
					new: true,
				})
					.lean()
					.exec()) ?? undefined
			);
		}

		return (
			(await this.#schemas.User.findOneAndUpdate(query, update, {
				new: true,
			})
				.lean()
				.exec()) ?? undefined
		);
	}

	async updateUser(
		query: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean> {
		const upd = await this.#schemas.User.updateOne(query, update).exec();
		return Boolean(upd?.modifiedCount && upd.modifiedCount > 0);
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
		}
	): Promise<User | undefined> {
		const cUser = await this.findUser(
			{ username: userInfo.username },
			"username"
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
			{ $set: { markedForDeletion: true } }
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
				account?.deletedCount && account?.deletedCount > 0
			),
			links: Boolean(links?.deletedCount && links?.deletedCount > 0),
		};
	}

	async findVerify(
		query: Record<string, unknown>
	): Promise<PendingMember | undefined> {
		return (
			(await this.#schemas.PendingMember.findOne(query).lean().exec()) ??
			undefined
		);
	}

	async findVerifies(
		query: Record<string, unknown>,
		selector?: string
	): Promise<PendingMember[]> {
		return this.#schemas.PendingMember.find(query, selector)
			.sort({ createdAt: 1 })
			.lean()
			.exec();
	}

	async verifyUser(
		id: string,
		options?: { admin?: boolean }
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
			options
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
		validationToken: string
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
		query: Record<string, unknown>,
		selector?: string
	): Promise<Upload | undefined> {
		return (
			(selector
				? await this.#schemas.Upload.findOne(query, selector)
						.lean()
						.exec()
				: await this.#schemas.Upload.findOne(query).lean().exec()) ??
			undefined
		);
	}

	async findAndDeleteFile(
		query: Record<string, unknown>
	): Promise<Upload | undefined> {
		return (
			(await this.#schemas.Upload.findOneAndDelete(query)
				.lean()
				.exec()) ?? undefined
		);
	}

	async findFiles(
		query: Record<string, unknown>,
		options?: {
			limit?: number;
			selector?: string;
			sort?: Record<string, unknown>;
		}
	): Promise<Upload[]> {
		const queryOptions: { limit?: number; sort?: Record<string, unknown> } =
			{};
		if (options?.limit) {
			queryOptions.limit = options.limit;
		}

		if (options?.sort) {
			queryOptions.sort = options.sort;
		}

		return this.#schemas.Upload.find(query, options?.selector, queryOptions)
			.lean()
			.exec();
	}

	async updateFile(
		query: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean | undefined> {
		const upd = await this.#schemas.Upload.updateOne(query, update).exec();
		if (upd?.modifiedCount && upd.modifiedCount > 0) {
			return true;
		}

		return undefined;
	}

	async makeFile(
		id: string,
		owner: string,
		path: string,
		types: { generic: string; mimetype: string }
	): Promise<Upload> {
		const file = new this.#schemas.Upload({
			id,
			owner,
			path,
			type: types.generic,
			mimetype: types.mimetype,
		});
		await file.save();
		return file;
	}

	/**
	 * Deletes a file from the database and the disk.
	 * If deleting files en masse, use db.purgeFiles
	 * @param query What file to remove
	 * @returns Whether or not the file was deleted
	 */
	async purgeFile(query: Record<string, unknown>): Promise<boolean> {
		const file = await this.#schemas.Upload.findOneAndDelete(query, {
			projection: "path",
		})
			.lean()
			.exec();
		if (!file) {
			return false;
		}

		if (existsSync(file.path)) {
			try {
				await fs.unlink(file.path);
			} catch (error: unknown) {
				if (error instanceof Error) {
					logger.error(
						`Database could not delete file ${file.path}. See error below.\n` +
							`Error: ${error.message}`
					);
				}

				logger.error(
					`Database could not delete file ${file.path}. Unknown Error`
				);
			}
		}

		return true;
	}

	/**
	 * Delete a massive amount of file records
	 * @param {Object} query The database query to match files to remove
	 * @param {number} [expectedDeletions] How many files to delete
	 * @returns Whether or not the deletion was successful
	 */
	async purgeFiles(
		query: Record<string, unknown>,
		expectedDeletions?: number
	): Promise<boolean> {
		const files = await this.#schemas.Upload.deleteMany(query)
			.lean()
			.exec();
		return expectedDeletions
			? files.deletedCount === expectedDeletions
			: files.acknowledged;
	}

	/* ---- LINK RELATED METHODS ---- */
	async findLink(
		query: Record<string, unknown>,
		selector?: string
	): Promise<Link | undefined> {
		return (
			(selector
				? await this.#schemas.Link.findOne(query, selector)
						.lean()
						.exec()
				: await this.#schemas.Link.findOne(query).lean().exec()) ??
			undefined
		);
	}

	async findAndDeleteLink(
		query: Record<string, unknown>
	): Promise<Link | undefined> {
		return (
			(await this.#schemas.Link.findOneAndDelete(query).lean().exec()) ??
			undefined
		);
	}

	async findLinks(
		query: Record<string, unknown>,
		options?: {
			limit?: number;
			selector?: string;
			sort?: Record<string, unknown>;
		}
	): Promise<Link[]> {
		const qoptions: { limit?: number; sort?: Record<string, unknown> } = {};
		if (options?.limit) {
			qoptions.limit = options.limit;
		}

		if (options?.sort) {
			qoptions.sort = options.sort;
		}

		return this.#schemas.Link.find(
			query,
			options?.selector,
			qoptions
		).lean();
	}

	async updateLink(
		query: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean> {
		const out = await this.#schemas.Upload.updateOne(query, update).exec();
		return Boolean(out?.modifiedCount && out.modifiedCount > 0);
	}

	async makeLink(id: string, owner: string, link: string): Promise<Link> {
		const link1 = new this.#schemas.Link({ id, owner, link });
		await link1.save();
		return link1;
	}

	async purgeLink(query: Record<string, unknown>): Promise<boolean> {
		const del = await this.#schemas.Link.deleteOne(query).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	/* ---- AUTHENTICATION RELATED METHODS ---- */
	async findToken(
		tokenID: string,
		userID: string,
		options?: {
			web?: boolean;
		}
	): Promise<Tokendb | undefined> {
		return (
			(await this.#schemas.Token.findOne({
				id: tokenID,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				userID,
				web: options?.web ?? false,
			})
				.lean<Tokendb>()
				.exec()) ?? undefined
		);
	}

	async findTokens(
		userID: string,
		options?: { web?: boolean }
	): Promise<Tokendb[]> {
		return this.#schemas.Token.find({
			// eslint-disable-next-line @typescript-eslint/naming-convention
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
		}
	): Promise<Tokendb | undefined> {
		const date = new Date();
		date.setDate(date.getDate() + 2 * 7);
		const tken = new this.#schemas.Token({
			id: tokenID,
			// eslint-disable-next-line @typescript-eslint/naming-convention
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
		options?: { web?: boolean }
	): Promise<boolean> {
		const del = await this.#schemas.Token.deleteOne({
			id: tokenID,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			userID,
			web: options?.web,
		}).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	async purgeTokens(
		userID: string,
		web?: boolean
	): Promise<number | undefined> {
		const del = web // eslint-disable-next-line @typescript-eslint/naming-convention
			? await this.#schemas.Token.deleteMany({ userID, web }).exec()
			: // eslint-disable-next-line @typescript-eslint/naming-convention
			  await this.#schemas.Token.deleteMany({ userID }).exec();
		return del.deletedCount;
	}

	/* ---- ADMIN RELATED METHODS ---- */
	async makeAdminNotify(
		id: string,
		notify: string,
		title: string
	): Promise<Notification> {
		const notif = new this.#schemas.AdminNotification({
			id,
			notify,
			title,
		});
		await notif.save();
		return notif;
	}

	async findAdminNotify(
		query: Record<string, unknown>
	): Promise<Notification | undefined> {
		return (
			(await this.#schemas.AdminNotification.findOne(query).lean()) ??
			undefined
		);
	}

	async findAdminNotifies(
		query: Record<string, unknown>
	): Promise<Notification[]> {
		return this.#schemas.AdminNotification.find(query)
			.sort({ createdAt: -1 })
			.lean()
			.exec();
	}

	async purgeAdminNotify(query: Record<string, unknown>): Promise<boolean> {
		const del = await this.#schemas.AdminNotification.deleteOne(
			query
		).exec();
		return Boolean(del?.deletedCount && del.deletedCount > 0);
	}

	/* ---- DATABBASE RELATED METHODS ---- */
	async shutdown(): Promise<void> {
		return this.#internals.connection.close();
	}
}
