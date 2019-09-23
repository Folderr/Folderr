function error(msg) {
    const box = document.getElementsByClassName('errbox')[0];
    const erName = document.getElementById('err');
    erName.innerHTML = msg;
    box.style.display = 'block';
}

const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

function unerror() {
    const box = document.getElementsByClassName('errbox')[0];
    const erName = document.getElementById('err');
    erName.innerHTML = '';
    box.style.display = 'none';
}

function login() {
    unerror();
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    if (!username.value || !password.value) {
        error('Username and password are required.');
        return false;
    }
    superagent.post('/api/login').send( { username: username.value, password: password.value } ).end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            error(err.response.text.slice('[ERROR] '.length) );
            return false;
        }
        location.replace('/');
    } );
}
