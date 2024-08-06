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

import nodemailer, { type SentMessageInfo } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { type Core } from "../internals";
import * as constants from "./constants/index";

/**
 *
 * @classdesc Handles emailing users
 *
 * @author VoidNulll
 *
 */
export default class Emailer {
	public active: boolean;

	private readonly mailer?: Mail;

	private readonly email?: string;

	readonly #core: Core;

	constructor(
		core: Core,
		email?: string,
		options?: {
			auth: {
				user: string;
				pass: string;
			};
			host: string;
			port?: number;
			secure?: boolean;
		},
		selfTest?: boolean
	) {
		this.#core = core;
		this.active = Boolean(options?.auth.pass);
		if (this.active) {
			this.mailer = nodemailer.createTransport({
				...options,
				tls: { rejectUnauthorized: false }, // Should be added to options
			});
			this.email = email;
			if (selfTest) {
				console.log("Self testing email...");
				console.log("Sending email to", this.email);
				void this.mailer.sendMail({
					from: this.email,
					to: this.email,
					subject: "Folderr Test Email",
					text: "Testing Folderr SMTP abilities. If you got this email, it works.",
				});
			}
		}
	}

	validateEmail(email: string): boolean {
		return this.#core.regexs.email.test(email);
	}

	async verifyEmail(
		email: string,
		verifyLink: string,
		username: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.VERIFY,
				text: constants.TEMPLATES.EMAILER_TEXTS.verify(
					username,
					verifyLink
				),
			});
		}

		return null;
	}

	async welcomeEmail(
		email: string,
		username: string,
		instanceLink: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.WELCOME,
				text: constants.TEMPLATES.EMAILER_TEXTS.welcome(
					username,
					instanceLink
				),
			});
		}

		return null;
	}

	async forgotPasswordEmail(
		email: string,
		forgotLink: string,
		username: string,
		instanceLink: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject:
					constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.FORGOT_PASSWARD,
				text: constants.TEMPLATES.EMAILER_TEXTS.forgotPassword(
					username,
					instanceLink,
					forgotLink
				),
				priority: "high",
			});
		}

		return null;
	}

	async warnEmail(
		email: string,
		reason: string,
		username: string,
		instanceLink: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.WARN,
				text: constants.TEMPLATES.EMAILER_TEXTS.warn(
					username,
					instanceLink,
					reason
				),
				priority: "high",
			});
		}

		return null;
	}

	async banEmail(
		email: string,
		reason: string,
		username: string,
		instanceLink: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.BAN,
				text: constants.TEMPLATES.EMAILER_TEXTS.ban(
					username,
					instanceLink,
					reason
				),
				priority: "high",
			});
		}

		return null;
	}

	async changeEmail(
		email: string,
		confirmLink: string,
		username: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject:
					constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.EMAIL_CHANGE,
				text: constants.TEMPLATES.EMAILER_TEXTS.emailChange(
					username,
					confirmLink
				),
				priority: "low",
			});
		}

		return null;
	}

	async takedown(
		{
			email,
			username,
			id,
			type,
		}: {
			email: string;
			username: string;
			id: string;
			type: string;
		},
		instanceLink: string
	): Promise<undefined | SentMessageInfo> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.TAKEDOWN,
				text: constants.TEMPLATES.EMAILER_TEXTS.takedown(
					username,
					type,
					id,
					instanceLink
				),
				priority: "low",
			});
		}

		return null;
	}
}
