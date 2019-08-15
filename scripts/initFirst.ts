import readline from 'readline';
import config from '../config.json';
import Base from '../src/Structures/Base';

const base = new Base(null, config, '--init-first');

const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    history: 0,
    // I read the docs and this exists, so TS & ESLint...
    // Shut up.
} );

let a: string | undefined;

const second = 1000;

async function verify(): Promise<string> {
    await base.Utils.sleep(second); // Sleep for a second
    if (!a) return verify();
    return a as string;
}

function _password(): Promise<string> {
    const q = 'What do you want your password to be? Note: Your password can only contain alphanumeric characters (A-z & 0-9) as well as the special symbols "&", "_", and "."\n';
    rl.question(q, (answer: string) => {
        if (!answer) {
            rl.write('This is required!');
            process.exit();
        }
        a = answer;
    } );
    return verify();
}

function _username(): Promise<string> {
    const q = 'What would you like your username to be? Note: Usernames can only contain lowercase letters, numbers, and an underscore\n';
    rl.question(q, (answer: string) => {
        if (!answer) {
            rl.write('This is required!\n');
            process.exit();
        }
        const maxName = 12;
        const minName = 3;
        if (answer.length > maxName || answer.length < minName) {
            rl.write('Username length is invalid! Length must be between 3 & 12\n');
            process.exit();
        }
        const match = answer.match(/[a-z0-9_]/g);
        if (!match || answer.length !== match.length) {
            rl.write('Username is invalid\n');
            process.exit();
        }
        a = answer;
    } );
    return verify();
}

(async function _initFirst(): Promise<void> {
    await base.init();
    const { User } = base.schemas;
    const user = await User.findOne( { first: true } ).exec();
    if (user) {
        rl.write('First user already initiated!\n');
        rl.close();
        process.exit();
    }
    rl.write('We have to initiate the first account (yours) as admin. First we will do your username\n');

    await base.Utils.sleep(second); // Sleep for a second

    const name: string = await _username();
    a = undefined;
    let password: string = await _password();
    const uID: string = await base.Utils.genUID();

    const passBase: string = password;
    password = await base.Utils.hashPass(password);
    const token = await base.Utils.genToken(uID);
    console.log(`Account created successfully! See your details below...\n\nAccount name: ${name}\nAccount password: ${passBase}\nAccount ID: ${uID}\nAccount API token (Keep this very safe): ${token.token}`);
    const owner = new User( {
        username: name, uID, first: true, admin: true, token: token.hash, password,
    } );
    await owner.save();
    process.exit();
}() );
