function error(msg) {
    const box = document.getElementsByClassName('errbox')[0];
    const erName = document.getElementById('err');
    erName.innerHTML = msg;
    box.style.display = 'block';
}

function unerror() {
    const box = document.getElementsByClassName('errbox')[0];
    const erName = document.getElementById('err');
    erName.innerHTML = '';
    box.style.display = 'none';
}

const notFound = 404;
const unauthorized = 401;
const badReq = 400;
const used = 226;

const codes = [
    notFound,
    unauthorized,
    badReq,
    used,
];

function signup() {
    unerror()
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    if (!username.value || !password.value) {
        error('Username and password are required.');
        return false;
    }
    console.log('Fuck yourself');
    superagent.post('/api/signup').send( { username: username.value, password: password.value } ).end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            error(res.text.slice('[ERROR] '.length) );
            return false;
        }
        const succ = document.getElementsByClassName('successbox')[0];
        const success = document.getElementById('success');
        success.innerHTML = 'The admins have been notified of your account request!';
        succ.style.display = 'block';
        return false;
    } );
}
