/* eslint max-len: ["error", { "code": 150 }] */

const EMAILER_TEXTS = {
	verify(username: string, verifyLink: string) {
		return (
			`Hello ${username[0]},\n` +
			`Your Folderr verification link for ${
				verifyLink[1].split('/verify')[0]
			} is ${verifyLink[1]}\n` +
			'The link will expire in 48 hours.\n' +
			`If you did not request an account click this link to deny the account request: ${verifyLink[1].replace(
				'verify',
				'deny'
			)}.`
		);
	},
	forgot_password(username: string, instanceLink: string, forgotLink: string) {
		return (
			`Hello ${username},\n` +
			`Please click the link below to reset your ${instanceLink} password.\n` +
			"If you didn't request a password reset, ignore this email and ensure your account is still secure.\n" +
			`Your password reset link is ${forgotLink}`
		);
	},
	warn(username: string, instanceLink: string, reason: string) {
		return (
			`Hello ${username},\n` +
			`You have been warned on Folderr ${instanceLink}\n` +
			`Reason: ${reason}`
		);
	},
	ban(username: string, instanceLink: string, reason: string) {
		return (
			`Hello ${username},\n` +
			`You have been banned on Folderr ${instanceLink}\n` +
			`Reason: ${reason}`
		);
	},
	email_change(username: string, confirmLink: string) {
		return (
			`Hello ${username},\n` +
			`Here is a link to confirm your email change ${confirmLink}\n` +
			'If you did not request an email change, please ignore this email.'
		);
	},
	takedown(username: string, type: string, id: string, instanceLink: string) {
		return (
			`Hello ${username},\n` +
			`Your content (type: ${type}) with ID ${id} was taken down by service administrators for Folderr instance ${instanceLink}`
		);
	}
};

const MONGOOSE = {
	expected_queries(expected: number, actual?: number) {
		return `MongooseDB > Input > findFullUser - Expected ${expected} queries in array but got ${
			actual ?? 'none'
		}`;
	}
};

const TEMPLATES = {
	EMAILER_TEXTS,
	MONGOOSE
};

export default TEMPLATES;
