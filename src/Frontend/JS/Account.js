const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

let tokenGen = false;
let eh;

function getAccount() {
    const hiddens = document.getElementsByClassName('hidden');
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    hiddens[1].style.color = 'black';
    hiddens[1].style.background = '#ffa94d';
    hiddens[2].style.background = '#6bff4d';
    hiddens[2].style.color = 'black';
    erName.innerHTML = '';
    erbox.style.display = 'none';
    const username = document.getElementById('username');
    superagent.get('/api/account')
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            eh = JSON.parse(res.text);
            username.placeholder = eh.username;
            tokenGen = eh.token_generated;
            const hidden = hiddens[0];
            hidden.style.display = 'block';
        } );
}

function savePass(pass) {
    const form = document.getElementById('form');
    const pas = document.getElementById('password');
    const elem = document.getElementById('retype-password');
    const gbtn = document.getElementById('gToken');
    const ubtn = document.getElementById('upPass');
    if (elem.value) {
        if (pass) {
            pas.value = elem.value;
        }
        elem.value = null;
    }
    form.removeChild(elem);
    form.removeChild(gbtn);
    form.removeChild(ubtn);
    form.submit();
    location.reload();
}

function updateAccountInfo() {
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    const username = document.getElementById('username');
    superagent.get('/api/account')
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            eh = JSON.parse(res.text);
            username.placeholder = eh.username;
            tokenGen = eh.token_generated;
        } );
}

function updateUsername() {
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const uExists = !!username.value;
    const pExists = !!password.value;
    if (!uExists || !pExists) {
        if (!uExists && !pExists) {
            erName.innerHTML = 'Missing username and password!';
            erbox.style.display = 'block';
            return false;
        }
        if (!uExists) {
            erName.innerHTML = 'Missing username!';
            erbox.style.display = 'block';
            return false;
        }
        erName.innerHTML = 'Missing password!';
        erbox.style.display = 'block';
        return false;
    }
    if (username.value === eh.username) {
        erName.innerHTML = 'Cannot update username to current username!';
        erbox.style.display = 'block';
    }
    superagent.patch('/api/account?key=0')
        .set( { username: eh.username, password: password.value } )
        .send( { new_key: username.value } )
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return false;
            }
            const success = document.getElementById('success');
            success.innerHTML = 'Updated username!';
            success.parentElement.style.display = 'block';
            savePass();
        } );
}

function updatePassword() {
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    const retype = document.getElementById('retype-password');
    const password = document.getElementById('password');
    const rExists = !!retype.value;
    const pExists = !!password.value;
    if (!rExists || !pExists) {
        if (!rExists && !pExists) {
            erName.innerHTML = 'Missing passwords!';
            erbox.style.display = 'block';
            return false;
        }
        if (!rExists) {
            erName.innerHTML = 'Missing new password!';
            erbox.style.display = 'block';
            return false;
        }
        erName.innerHTML = 'Missing password!';
        erbox.style.display = 'block';
        return false;
    }
    if (retype.value === password.value) {
        erName.innerHTML = 'Cannot update password to current password!';
        erbox.style.display = 'block';
    }
    superagent.patch('/api/account?key=1')
        .set( { username: eh.username, password: password.value } )
        .send( { new_key: retype.value } )
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            const success = document.getElementById('success');
            success.innerHTML = 'Updated password!';
            success.parentElement.style.display = 'block';
            updateAccountInfo();
            savePass(true);
        } );
}

function genToken() {
    const k = document.getElementsByClassName('hidden');
    k[1].style.display = 'none';
    k[2].style.display = 'none';
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    const password = document.getElementById('password');
    if (!password.value) {
        erName.innerHTML = 'Missing password!';
        erbox.style.display = 'block';
        return false;
    }
    erName.innerHTML = '';
    erbox.style.display = 'none';
    if (tokenGen) {
        const sure = document.getElementsByClassName('hidden')[1];
        sure.style.display = 'block';
        return false;
    }
    superagent.post('/api/token')
        .set( { password: password.value, username: eh.username } )
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            const token = document.getElementById('a_token');
            token.value = res.text;
            token.parentElement.style.display = 'block';
            updateAccountInfo();
        } );
}

function forceRegenToken() {
    const sure = document.getElementsByClassName('hidden')[1];
    sure.style.display = 'none';
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    const password = document.getElementById('password');
    if (!password.value) {
        erName.innerHTML = 'Missing password!';
        erbox.style.display = 'block';
        return false;
    }
    erName.innerHTML = '';
    erbox.style.display = 'none';
    superagent.post('/api/token?flags=force')
        .set( { password: password.value, username: eh.username } )
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            const token = document.getElementById('a_token');
            token.value = res.text;
            token.parentElement.style.display = 'block';
            updateAccountInfo();
        } );
}

function abortRegen() {
    const hidden = document.getElementsByClassName('hidden');
    const sure = hidden[1];
    const aborted = hidden[2];
    sure.style.display = 'none';
    aborted.style.display = 'block';
}

function copyToken() {
    const token = document.getElementById('a_token');
    token.select();
    token.setSelectionRange(0, 99999);
    const box = document.getElementsByClassName('successbox')[0];
    const succ = document.getElementById('success');

    document.execCommand('copy');
    succ.innerHTML = `Copied token!`;
    box.style.display = 'block';
}

