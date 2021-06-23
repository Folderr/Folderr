import readline from 'readline';
import Core from '../src/Structures/core';
import fs from 'fs/promises';
import os from 'os';
import {join} from 'path';
import locations from '../internal/locations.json';
import ConfigHandler from '../src/handlers/config-handler';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
});

async function getKeyLocation(redo?: boolean): Promise<string> {
	const homedir = os.homedir();
	const keyDirOption = join(homedir, '.folderr/keys');
	const redoQuestion =
		'That is not an option, please re-read the question and the options carefully';
	const question =
		'Would you like your private key to be held under your homedir or internally?\n' +
		'The homedir is for running multiple of the same instance on the same machine' +
		' Folderr does not recommend this.' +
		'\nIf you choose to have multiple different instances, do not choose this option' +
		`\nThe location it would be stored under for your homedir is ${keyDirOption}` +
		'\nYour options are: "homedir" or "internal"\n> ';
	const options = new Set(['homedir', 'internal']);
	return new Promise<string>((resolve) => {
		rl.question(redo ? redoQuestion : question, (answer) => {
			if (!options.has(answer)) {
				resolve(getKeyLocation(true));
			} else if (answer === 'homedir') {
				resolve(keyDirOption);
			} else {
				resolve('internal');
			}
		});
	});
}

(async function () {
	rl.write(
		'Welcome to the Folderr setup CLI!\nGive us a moment while we check setup status...'
	);
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
				'An error occured during setup. Please create an issue at our github at' +
				'https://github.com/Folderr/Folderr with the details below:\n' +
				`Error message: "${error.message}"\nStack trace?:\n${
					error.stack ?? 'None'
				}` +
				'Folderr Setup will now exit.';
			console.log(unknownError); // eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}
	}

	const owner = await core.db.findUser({owner: true});
	if (!keysConfigured) {
		rl.write(
			'It appears you have not configured your keys. please follow the prompts to do so.'
		);
		const location = await getKeyLocation();
		const keys = await core.Utils.genKeyPair();
		let actualLocation = location;
		if (location === 'internal') {
			actualLocation = join(process.cwd(), 'internals/keys');
		}

		const privateKey =
			keys.privateKey instanceof Buffer
				? keys.privateKey
				: keys.privateKey.export({
						format: 'pem',
						type: 'pkcs8'
				  });
		const publicKey =
			keys.publicKey instanceof Buffer
				? keys.publicKey
				: keys.privateKey.export({
						format: 'pem',
						type: 'spki'
				  });
		const actualPubKey =
			typeof publicKey === 'string' ? Buffer.from(publicKey) : publicKey;
		await fs.writeFile(join(actualLocation, 'privateJWT.pem'), privateKey);
		await core.db.createFolderr(actualPubKey);
	}

	if (!owner) {
		rl.write(
			'This instance does not have an owner. The instance will not function without an owner.'
		);
		rl.write('Please configure an owner via the guided prompts.');
		rl.write('IMPL OWNER SETUP');
	}
})();
