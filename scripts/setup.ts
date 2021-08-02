/* eslint complexity: [1, {max: 24 }] */
import fs from 'fs/promises';
import os from 'os';
import {join} from 'path';
import readline from 'readline';
import {Writable} from 'stream';
import Core from '../src/Structures/core';
import locations from '../internal/locations.json';
import ConfigHandler from '../src/handlers/config-handler';

class MuteStreamHandler {
	public muted: boolean;

	public stream: Writable;

	constructor() {
		this.muted = false;
		this.stream = new Writable({
			write: (chunk, encoding, callback) => {
				if (!this.isMuted()) {
					process.stdout.write(chunk, encoding);
				}

				callback();
			}
		});
	}

	isMuted(): boolean {
		return this.muted;
	}
}

const stream = new MuteStreamHandler();

const rl = readline.createInterface({
	input: process.stdin,
	output: stream.stream,
	terminal: true
});

async function getKeyLocation(redo?: boolean): Promise<string> {
	const homedir = os.homedir();
	const keyDirOption = join(homedir, '.folderr/keys');
	const redoQuestion =
		'That is not an option, please re-read the question and the options carefully';
	const question =
		'Would you like your private key to be held under your home directory or internally?\n' +
		'The home directory is for running multiple of the same instance on the same machine' +
		'with the same user.' +
		' Folderr does not recommend this.' +
		'\nIf you choose to have multiple different instances, do not choose this option' +
		`\nThe location it would be stored under for your home directory is "${keyDirOption}"` +
		'\nYour options are: "homedir" or "internal"\n> ';
	const options = new Set(['homedir', 'internal']);
	return new Promise<string>((resolve) => {
		rl.question(redo ? redoQuestion : question, (answer) => {
			if (!answer) {
				resolve(getKeyLocation(true));
			} else if (['quit', 'q'].includes(answer)) {
				rl.write('Exiting setup by user decision.');
				rl.close(); // eslint-disable-next-line unicorn/no-process-exit
				process.exit();
			} else if (!options.has(answer)) {
				resolve(getKeyLocation(true));
			} else if (answer === 'homedir') {
				resolve(keyDirOption);
			} else if (answer === 'internal') {
				resolve('internal');
			} else {
				resolve(getKeyLocation(true));
			}
		});
	});
}

async function askUsername(core: Core): Promise<string> {
	return new Promise<string>((resolve) => {
		const q = // eslint-disable-next-line max-len
			'What would you like your username to be? Note: Usernames can only contain lowercase letters, numbers, and an underscore\n> ';
		rl.question(q, (answer: string) => {
			if (!answer) {
				rl.write('Give me a username!\n');
				resolve(askUsername(core));
				return;
			}

			if (answer === 'q' || answer === 'quit') {
				rl.write('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit(); // This is a cli app, thanks.
			}

			if (!core.regexs.username.test(answer)) {
				rl.write('Invalid username! Retry!\n');
				resolve(askUsername(core));
				return;
			}

			resolve(answer);
		});
	});
}

async function askPassword(core: Core, confirm?: boolean): Promise<string> {
	let q =
		'What would you like your password to be?' +
		'\nYour password must be 8-32 characters long,' +
		'\nInclude 1 uppercase & lowercase letter,' +
		'\nInclude 1 number,' +
		'\nYour password may have these special characters: #?!@$%^&*-_[]' +
		'\n> ';
	if (confirm) {
		q = 'Re-enter your password\n> ';
	}

	return new Promise<string>((resolve) => {
		rl.question(q, (answer: string) => {
			stream.muted = false;
			if (!answer) {
				console.log('I require a password!\n');
				resolve(askPassword(core, confirm));
				return;
			}

			if (answer === 'q' || answer === 'quit') {
				console.log('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit(); // This is a cli app, thanks.
			}

			if (!core.regexs.password.test(answer)) {
				console.log('Invalid password! Try again!\n');
				resolve(askPassword(core, confirm));
				return;
			}

			resolve(answer);
		});
		stream.muted = true;
	});
}

async function askEmail(core: Core): Promise<string> {
	return new Promise<string>((resolve) => {
		rl.question('What is your email?\n> ', (answer: string) => {
			if (!answer) {
				rl.write('I need an email!\n');
				resolve(askEmail(core));
				return;
			}

			if (answer === 'q' || answer === 'quit') {
				rl.write('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit(); // This is a cli app, thanks.
			}

			if (!core.emailer.validateEmail(answer)) {
				rl.write('Invalid Email!\n');
				resolve(askEmail(core));
				return;
			}

			resolve(answer);
		});
	});
}

async function confirmDetails(
	username: string,
	email: string,
	password: string,
	redo?: boolean
): Promise<'yes' | 'no'> {
	let question =
		'Confirm this is the email, username, and password you want for the owner account:\n' +
		`Username: ${username}\n` +
		`Password: ${password}\n` +
		`Email: ${email}\n` +
		'Is this correct? (yes/no)\n' +
		'> ';
	if (redo) {
		question = `That is not an option.\n${question}`;
	}

	return new Promise<'yes' | 'no'>((resolve) => {
		rl.question(question, (answer) => {
			if (!answer) {
				rl.write("I need confirmation. Let's try this again.");
				resolve(confirmDetails(username, email, password));
			} else if (answer === 'q' || answer === 'quit') {
				rl.write('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit();
			} else if (['yes', 'y'].includes(answer)) {
				resolve('yes');
			} else if (['no', 'n'].includes(answer)) {
				resolve('no');
			} else {
				resolve(confirmDetails(username, email, password, true));
			}
		});
	});
}

(async function () {
	rl.write(
		'Welcome to the Folderr setup CLI!\nGive us a moment while we check setup status...'
	);
	if (
		!(await fs.stat(join(process.cwd(), 'configs/server.yaml'))) ||
		!(await fs.stat(join(process.cwd(), 'configs/db.yaml')))
	) {
		rl.write(
			'Setup has determined you have not configured Folderr.' +
				' Please configure with "npm run configure" before running this command' +
				'\nIf you have configured Folderr,' +
				' please ensure I have the correct permissions to ' +
				'read, write, and execute the files.\n' +
				'See the Folderr documentation about file permissions at ' +
				'https://folderr.net/documentation/folderr/v2 for more details/guidance'
		);
		rl.close(); // eslint-disable-next-line unicorn/no-process-exit
		process.exit();
	}

	try {
		ConfigHandler.verifyFetch(true);
	} catch (error: unknown) {
		if (error instanceof Error) {
			rl.write(error.message);
			rl.close(); // eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}
	}

	const keysConfigured = locations.keyConfigured;
	const core = new Core();
	await core.initDB();
	try {
		const folderr = await core.db.fetchFolderr();
		if (folderr) {
			rl.write('Folderr appears to have been setup previously. Exiting');
			rl.close(); // eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message !==
				'Folderr DB entry not found, Folderr DB entry is required.'
		) {
			rl.close();
			const unknownError =
				'An error occured during setup. ' +
				'If you find there are no issues relating to this error, ' +
				'please create an issue on our github at' +
				'https://github.com/Folderr/Folderr/issues with the details below:\n' +
				`Error message: "${error.message}"\nStack trace?:\n${
					error.stack ?? 'None'
				}` +
				'Folderr Setup will now exit.';
			console.log(unknownError); // eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}
	}

	const owner = await core.db.findUser({owner: true}, 'owner id');
	rl.write("You're not setup, lets fix that.");
	let username: string | undefined;
	let password: string | undefined;
	let email: string | undefined;
	await core.Utils.sleep(1000);

	if (!owner) {
		rl.write(
			'\nThis instance does not have an owner.' +
				' The instance will not function without an owner.'
		);
		await core.Utils.sleep(1000);
		const statement =
			'\nPlease configure an owner account via the guided prompts.\n' +
			'We need a username, email, and password.\n';
		rl.write(statement);
		await core.Utils.sleep(1000);
		username = await askUsername(core);
		password = await askPassword(core);
		await core.Utils.sleep(1000);
		rl.write('\n');
		email = await askEmail(core);
		const passwordConfirm = await askPassword(core, true);
		if (passwordConfirm === password) {
			rl.write('Details saved\n');
		} else {
			rl.write('Invalid password, closing setup. Retry with "npm run setup"');
			rl.close(); // eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}

		const confirm = await confirmDetails(username, email, password);
		if (confirm === 'no') {
			rl.write('To retry, re-run "npm run setup"');
			rl.close(); // eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}
	}

	if (!keysConfigured) {
		rl.write(
			'It appears you have not configured your authorization keys.' +
				' Please follow the prompts to do so.\n'
		);
		const location = await getKeyLocation();
		const keys = await core.Utils.genKeyPair();
		let actualLocation = location;
		if (location === 'internal') {
			actualLocation = join(process.cwd(), 'internal/keys');
		}

		const privateKey =
			keys.privateKey instanceof Buffer || typeof keys.privateKey === 'string'
				? keys.privateKey
				: keys.privateKey.export({
						format: 'pem',
						type: 'pkcs8'
				  });
		const publicKey =
			keys.publicKey instanceof Buffer || typeof keys.publicKey === 'string'
				? keys.publicKey
				: keys.privateKey.export({
						format: 'pem',
						type: 'spki'
				  });
		const actualPubKey =
			typeof publicKey === 'string' ? Buffer.from(publicKey) : publicKey;
		const actualPrivateKey =
			typeof privateKey === 'string' ? Buffer.from(privateKey) : privateKey;
		await fs.writeFile(`${actualLocation}/privateJWT.pem`, actualPrivateKey);
		await core.db.createFolderr(actualPubKey);
	}

	if (username && email && password) {
		const id = core.Utils.genV4UUID();
		const hashedPassword = await core.Utils.hashPass(password);
		await core.db.makeOwner(username, hashedPassword, id, email);
		console.log(
			'Owner account created successfully. Information below.\n' +
				`User ID: ${id}\n` +
				`Username: ${username}\n` +
				`Email address: ${email}\n` +
				`Password: ${password}`
		);
		rl.close(); // eslint-disable-next-line unicorn/no-process-exit
		process.exit();
	}
})();
