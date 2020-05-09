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
import config from '../config.json';
import Folderr from '../src/Structures/Folderr';

const evolve = new Folderr(config, '--init-first');
const { base } = evolve;

const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
    terminal: true,
} );

function _password(evolve: Folderr): Promise<string> {
    const q = 'What would you like your password to be?\nYour password must be 8-32 characters long,\nInclude 1 uppercase & lowercase letter,\nInclude 1 number,\nYour password may have these special characters: #?!@$%^&*-_[]\nInput: ';
    return new Promise<string>(resolve => {
        rl.question(q, (answer: string) => {
            if (!answer) {
                rl.write('I require a password!');
                return resolve(_password(evolve) );
            }
            if (answer === 'q' || answer === 'quit') {
                rl.write('Quitting...');
                process.exit();
            }
            if (!evolve.base.Utils.regexs.password.test(answer) ) {
                rl.write('Invalid password! Try again!');
                return resolve(_password(evolve) );
            }
            return resolve(answer);
        } );
    } );
}

function _email(evolve: Folderr): Promise<string> {
    return new Promise<string>(resolve => {
        rl.question('What is your email?\nInput: ', (answer: string) => {
            if (!answer) {
                rl.write('I need an email!');
                return resolve(_email(evolve) );
            }
            if (answer === 'q' || answer === 'quit') {
                rl.write('Quitting...');
                process.exit();
            }
            if (!evolve.base.emailer.validateEmail(answer) ) {
                rl.write('Invalid Email!');
                return resolve(_email(evolve) );
            }
            return resolve(answer);
        } );
    } );
}

function _username(): Promise<string> {
    return new Promise<string>(resolve => {
        const q = 'What would you like your username to be? Note: Usernames can only contain lowercase letters, numbers, and an underscore\nInput: ';
        rl.question(q, (answer: string) => {
            if (!answer) {
                rl.write('Give me a username!\n');
                return resolve(_username() );
            }
            if (answer === 'q' || answer === 'quit') {
                rl.write('Quitting...');
                process.exit();
            }
            const regex = /[a-z0-9_]{3,12}/;
            const match = answer.match(regex);
            if (!regex.test(answer) || (match && match[0].length < answer.length) ) {
                rl.write('Invalid username! Retry!\n');
                return resolve(_username() );
            }
            return resolve(answer);
        } );
    } );
}

(async function _initFirst(): Promise<void> {
    await base.initDB();
    const user = await evolve.base.db.findUser( { first: true }, 'first');
    if (user) {
        rl.write('First user already initiated!\n');
        rl.close();
        process.exit();
    }
    rl.write('We have to initiate the first account (yours) as admin.\nEnter "q" or "quit" at any time to exit.\n');

    await base.Utils.sleep(1000); // Sleep for a second

    const name: string = await _username();
    let password: string = await _password(evolve);
    const email = evolve.base.Utils.encrypt(await _email(evolve) );
    const uID: string = await base.Utils.genUID();
    rl.close();

    const passBase: string = password;
    password = await base.Utils.hashPass(password);
    await base.Utils.sleep(1000);
    await evolve.base.db.makeOwner(name, password, uID, email);
    console.log(`Account created successfully! See your details below...\n\nAccount name: ${name}\nAccount password: ${passBase}\nAccount ID: ${uID}`);
    process.exit();
}() );
