import readline from 'readline';
import config from '../config';
import Base from '../src/Structures/Base';

const base = new Base(null, config, '--init-first');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    history: 0
});

let a;

async function verify() {
    await base.Utils.sleep(1000);
    if (!a) return verify(a);
    return a;
}

function _password() {
    const q = 'What do you want your password to be? Note: Your password can only contain alphanumeric characters (A-z & 0-9) as well as the special symbols "&", "_", and "."\n';
    rl.question(q, (answer) => {
        if (!answer) {
            rl.write('This is required!');
            process.exit();
        }
        a = answer;
    } );
    return verify();
}

async function _username() {
    const q = 'What would you like your username to be? Note: Usernames can only contain lowercase letters, numbers, and an underscore\n';
    rl.question(q, (answer) => {
        if (!answer) {
            rl.write('This is required!\n');
            process.exit();
        }
        if (answer.length > 12 || answer.length < 3) {
            rl.write('Username length is invalid! Length must be between 3 & 12\n');
            process.exit();
        }
        if (answer.length !== answer.match(/[a-z0-9_]/g).length) {
            rl.write('Username is invalid\n');
            process.exit();
        }
        a = answer;
    } );
    return verify();
}

(async function _initFirst() {
    await base.init();
    const User = base.schemas.User;
    const user = await User.findOne({ first: true }).exec();
    if (user) {
        rl.write('First user already initiated!\n');
        rl.close();
        process.exit();
    }
    rl.write('We have to initiate the first account (yours) as admin. First we will do your username\n');

    await base.Utils.sleep(1000);

    let name = await _username();
    a = undefined;
    let password = await _password();
    rl.close();
    const uID = await base.Utils.genUID();

    const passBase = password;
    password = await base.Utils.hashPass(password);
    const token = await base.Utils.genToken(uID);
    console.log(`Account created successfully! See your details below...\n\nAccount name: ${name}\nAccount password: ${passBase}\nAccount ID: ${uID}\nAccount API token (Keep this very safe): ${token.token}`);
    const owner = new User({ username: name, uID, first: true, admin: true, token: token.hash, password: password });
    await owner.save();
    process.exit();
}());
