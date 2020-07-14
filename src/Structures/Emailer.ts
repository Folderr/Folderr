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

import nodemailer, { SentMessageInfo } from 'nodemailer';
import Folderr from './Folderr';
import Mail from 'nodemailer/lib/mailer';

/**
 *
 * @classdesc Handles emailing users
 *
 * @author VoidNulll
 *
 */
export default class Emailer {
    public active: boolean;

    private folderr: Folderr;

    private mailer?: Mail;

    private email?: string;

    constructor(folderr: Folderr, email?: string, options?: { auth: { user: string; pass: string }; host: string; port?: number; secure?: boolean } ) {
        this.folderr = folderr;
        this.active = !!options;
        if (this.active) {
            this.mailer = nodemailer.createTransport(options);
            this.email = email;
        }
    }

    validateEmail(email: string): boolean {
        return this.folderr.regexs.email.test(email);
    }

    async verifyEmail(email: string, verifyLink: string, username: string): Promise<null | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Folderr Account Verification',
                text: `Hello ${username},\nYour Foldderr verification link for instance ${verifyLink.split('/verify')[0]} is ${verifyLink}\nThe link will expire in 48 hours.\nDid not request an account? Click this link ${verifyLink.replace('verify', 'deny')}.`,
                priority: 'low',
            } );
        }
        return null;
    }

    async forgotPasswordEmail(email: string, forgotLink: string, username: string, instanceLink: string): Promise<null | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Your Folderr account has had a password reset request',
                text: `Hello ${username},\nPlease click the link below to reset your ${instanceLink} password. If you didn't request a password reset, ignore this email and make sure your account is still secure.\nYour password reset link is ${forgotLink}`,
                priority: 'high',
            } );
        }
        return null;
    }

    async warnEmail(email: string, reason: string, username: string, instanceURL: string): Promise<null | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Folderr Account Warning',
                text: `Hello ${username},\nYou have been warned on Folderr instance ${instanceURL}\nReason: ${reason}`,
                priority: 'high',
            } );
        }
        return null;
    }

    async banEmail(email: string, reason: string, username: string, instanceURL: string): Promise<null | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Folderr Account Banned',
                text: `Hello ${username},\nYou have been banned on Folderr instance ${instanceURL}\nReason: ${reason}`,
                priority: 'high',
            } );
        }
        return null;
    }

    async changeEmail(email: string, confirmLink: string, username: string): Promise<null | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Email Change Confirmation',
                text: `Hello ${username},\nHere is a link to confirm your email change ${confirmLink}\nIf you did not request an email change, please ignore this email.`,
                priority: 'low',
            } );
        }
        return null;
    }

    async takedown(email: string, username: string, instanceURL: string, id: string, type: string): Promise<null | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Content Takedown',
                text: `Hello ${username},\nYour content (type: ${type}) with ID ${id} was taken down by service administrators for Folderr instance ${instanceURL}`,
                priority: 'low',
            } );
        }
        return null;
    }
}
