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

import readline from 'readline';
import Core from '../src/Structures/core';

const core = new Core();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
});

async function fetch_password(): Promise<string> {
	const q = 'What would you like your password to be?' +
	'\nYour password must be 8-32 characters long,' +
	'\nInclude 1 uppercase & lowercase letter,' +
	'\nInclude 1 number,' +
	'\nYour password may have these special characters: #?!@$%^&*-_[]' +
	'\nInput: ';
	return new Promise<string>(resolve => {
		rl.question(q, (answer: string) => {
			if (!answer) {
				rl.write('I require a password!');
				resolve(fetch_password());
				return;
			}

			if (answer === 'q' || answer === 'quit') {
				rl.write('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit(); // This is a cli app, thanks.
			}

			if (!core.regexs.password.test(answer)) {
				rl.write('Invalid password! Try again!');
				resolve(fetch_password());
				return;
			}

			resolve(answer);
		});
	});
}

async function fetch_email(): Promise<string> {
	return new Promise<string>(resolve => {
		rl.question('What is your email?\nInput: ', (answer: string) => {
			if (!answer) {
				rl.write('I need an email!');
				resolve(fetch_email());
				return;
			}

			if (answer === 'q' || answer === 'quit') {
				rl.write('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit(); // This is a cli app, thanks.
			}

			if (!core.emailer.validateEmail(answer)) {
				rl.write('Invalid Email!');
				resolve(fetch_email());
				return;
			}

			resolve(answer);
		});
	});
}

async function fetch_username(): Promise<string> {
	return new Promise<string>(resolve => { // eslint-disable-next-line max-len
		const q = 'What would you like your username to be? Note: Usernames can only contain lowercase letters, numbers, and an underscore\nInput: ';
		rl.question(q, (answer: string) => {
			if (!answer) {
				rl.write('Give me a username!\n');
				resolve(fetch_username());
				return;
			}

			if (answer === 'q' || answer === 'quit') {
				rl.write('Quitting...'); // eslint-disable-next-line unicorn/no-process-exit
				process.exit(); // This is a cli app, thanks.
			}

			if (!core.regexs.username.test(answer)) {
				rl.write('Invalid username! Retry!\n');
				resolve(fetch_username());
				return;
			}

			resolve(answer);
		});
	});
}

(async function (): Promise<void> {
	await core.initDB();
	const user = await core.db.findUser({first: true}, 'first');
	if (user) {
		rl.write('First user already initiated!\n');
		rl.close(); // eslint-disable-next-line unicorn/no-process-exit
		process.exit(1); // This is a cli app, thanks.
	}

	rl.write('We have to initiate the first account (yours) as admin.' +
	'\nEnter "q" or "quit" at any time to exit.\n');

	await core.Utils.sleep(1000); // Sleep for a second

	const name: string = await fetch_username();
	let password: string = await fetch_password();
	const email = core.Utils.encrypt(await fetch_email());
	const uID: string = await core.Utils.genUID();
	rl.close();

	const passBase: string = password;
	password = await core.Utils.hashPass(password);
	await core.Utils.sleep(1000);
	await core.db.makeOwner(name, password, uID, email);
	console.log('Account created successfully! See your details below...' +
	`\n\nAccount name: ${name}` +
	`\nAccount password: ${passBase}` +
	`\nAccount ID: ${uID}`);// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0); // This is a cli app, thanks.
})();
