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

import nodemailer, {SentMessageInfo} from 'nodemailer';
import Core from './core';
import Mail from 'nodemailer/lib/mailer';
import * as constants from './constants/index';

/**
 *
 * @classdesc Handles emailing users
 *
 * @author VoidNulll
 *
 */
export default class Emailer { /* eslint-disable @typescript-eslint/indent */
	public active: boolean;

    #core: Core;

    private readonly mailer?: Mail;

    private readonly email?: string;

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
		}
	) {
		this.#core = core;
		this.active = Boolean(options);
		if (this.active) {
			this.mailer = nodemailer.createTransport(options);
			this.email = email;
		}
    }

    validateEmail(email: string): boolean {
		return this.#core.regexs.email.test(email);
    }

    async verifyEmail(
		email: string,
		verifyLink: string,
		username: string
	): Promise<
		null |
		SentMessageInfo
	> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.VERIFY,
				text: constants.TEMPLATES.EMAILER_TEXTS.verify(username, verifyLink),
				priority: 'low'
			});
		}

		return null;
    }

    async forgotPasswordEmail(
		email: string,
		forgotLink: string,
		username: string,
		instanceLink: string
	): Promise<
		null |
		SentMessageInfo
	> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.FORGOT_PASSWARD,
				text: constants.TEMPLATES.EMAILER_TEXTS.forgot_password(
					username,
					instanceLink,
					forgotLink
				),
				priority: 'high'
			});
		}

		return null;
    }

    async warnEmail(
		email: string,
		reason: string,
		username: string,
		instanceLink: string
	): Promise<
		null |
		SentMessageInfo
	> {
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
				priority: 'high'
			});
		}

		return null;
    }

    async banEmail(
		email: string,
		reason: string,
		username: string,
		instanceLink: string
	): Promise<
		null |
		SentMessageInfo
		> {
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
				priority: 'high'
			});
		}

		return null;
    }

    async changeEmail(
		email: string,
		confirmLink: string,
		username: string
	): Promise<
		null |
		SentMessageInfo
	> {
		if (this.email && this.mailer) {
			return this.mailer.sendMail({
				from: this.email,
				to: email,
				subject: constants.ENUMS.RESPONSES.EMAILER_SUBJECTS.EMAIL_CHANGE,
				text: constants.TEMPLATES.EMAILER_TEXTS.email_change(
					username,
					confirmLink
				),
				priority: 'low'
			});
		}

		return null;
    }

    async takedown({email, username, id, type}: {
		email: string;
		username: string;
		id: string;
		type: string;
	}, instanceLink: string): Promise<null | SentMessageInfo> {
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
				priority: 'low'
			});
		}

		return null;
    }
}

/* eslint-enable @typescript-eslint/indent */
