/* eslint max-len: ["error", { "code": 150 }] */

// eslint-disable-next-line @typescript-eslint/naming-convention
const EMAILER_TEXTS = {
	verify(username: string, verifyLink: string) {
		return (
			`Hello ${username},\n` +
			`Your Folderr verification link for ${
				verifyLink.split("/verify")[0]
			} is ${verifyLink}\n` +
			"The link will expire in 48 hours.\n" +
			`If you did not request an account click this link to deny the account request: ${verifyLink.replace(
				"verify",
				"deny"
			)}.`
		);
	},
	forgotPassword(username: string, instanceLink: string, forgotLink: string) {
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
			`You have been warned on Folderr instance ${instanceLink}\n` +
			`Reason: ${reason}`
		);
	},
	welcome(username: string, instanceLink: string) {
		return (
			`Hello ${username},\n` +
			`Welcome to the Folderr instance at ${instanceLink}\n` +
			`If you want to learn more about Folderr (or how to use it) you can visit https://folderr.net for our documentation\n` +
			"\nHave a good day,\nFolderr Staff"
		);
	},
	ban(username: string, instanceLink: string, reason: string) {
		return (
			`Hello ${username},\n` +
			`You have been banned from Folderr instance ${instanceLink}\n` +
			`Reason: ${reason}`
		);
	},
	emailChange(username: string, confirmLink: string) {
		return (
			`Hello ${username},\n` +
			`Here is a link to confirm your email change ${confirmLink}\n` +
			"If you did not request an email change, please ignore this email, it will expire in 48 hours."
		);
	},
	takedown(username: string, type: string, id: string, instanceLink: string) {
		return (
			`Hello ${username},\n` +
			`Your content (type: ${type}) with ID ${id} was taken down by service administrators for Folderr instance ${instanceLink}`
		);
	},
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const MONGOOSE = {
	expectedQueries(expected: number, actual?: number) {
		return `MongooseDB > Input > findFullUser - Expected ${expected} queries in array but got ${
			actual ?? "none"
		}`;
	},
};

/* eslint-disable @typescript-eslint/naming-convention */
const TEMPLATES = {
	EMAILER_TEXTS,
	MONGOOSE,
};

/* eslint-enable @typescript-eslint/naming-convention */

export default TEMPLATES;
