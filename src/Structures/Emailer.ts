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
import Mail from 'nodemailer/lib/mailer';

export default class Emailer {
    public active: boolean;

    private mailer?: Mail;

    private email?: string;

    constructor(email?: string, options?: { auth: { user: string; pass: string }; host: string; port?: number; secure?: boolean } ) {
        this.active = !!options;
        if (this.active) {
            this.mailer = nodemailer.createTransport(options);
            this.email = email;
        }
    }

    validateEmail(email: string): boolean {
        const emailRegex =  /([A-Za-z0-9_.\-$%#!+/=^;&'*]{2,})?@([a-z0-9-]{2,})?\.([a-z]{2,})?/;
        return emailRegex.test(email);
    }

    async verifyEmail(email: string, verifyLink: string, username: string): Promise<void | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Folderr Account Verification',
                text: `Hello ${username},\nYour Foldderr verification link for instance ${verifyLink.split('/verify')[0]} is ${verifyLink}\nThe link will expire in 48 hours.\nDid not request an account? Click this link ${verifyLink.replace('verify', 'deny')}.`,
                priority: 'low',
            } );
        }
        return;
    }

    async forgotPasswordEmail(email: string, forgotLink: string, username: string, instanceLink: string): Promise<void | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Your Folderr account has had a password reset request',
                text: `Hello ${username},\nPlease click the link below to reset your ${instanceLink} password. If you didn't request a password reset, ignore this email and make sure your account is still secure.\nYour password reset link is ${forgotLink}`,
                priority: 'high',
            } );
        }
        return;
    }

    async warnEmail(email: string, reason: string, username: string, instanceURL: string) {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Folderr Account Warning',
                text: `Hello ${username},\nYou have been warned on Folderr instance ${instanceURL}\nReason: ${reason}`,
                priority: 'high',
            } );
        }
        return;
    }

    async banEmail(email: string, reason: string, username: string, instanceURL: string) {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Folderr Account Banned',
                text: `Hello ${username},\nYou have been banned on Folderr instance ${instanceURL}\nReason: ${reason}`,
                priority: 'high',
            } );
        }
        return;
    }

    async changeEmail(email: string, confirmLink: string, username: string): Promise<void | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Email Change Confirmation',
                text: `Hello ${username},\nHere is a link to confirm your email change ${confirmLink}\nIf you did not request an email change, please ignore this email.`,
                priority: 'low',
            } );
        }
        return;
    }

    async takedown(email: string, username: string, instanceURL: string, id: string, type: string): Promise<void | SentMessageInfo> {
        if (this.email && this.mailer) {
            return this.mailer.sendMail( {
                from: this.email,
                to: email,
                subject: 'Content Takedown',
                text: `Hello ${username},\nYour content (type: ${type}) with ID ${id} was taken down by service administrators for Folderr instance ${instanceURL}`,
                priority: 'low',
            } );
        }
        return;
    }
}
