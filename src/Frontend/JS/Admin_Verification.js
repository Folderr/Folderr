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

function resetForm() {
    const uh = document.getElementById('form');
    uh.reset();
}

function deny() {
    const token = document.getElementById('token');
    const uID = document.getElementById('uID');
    if (!uID.value || !token.value) {
        error('Missing user ID or token.');
        return false;
    }
    superagent.delete('/api/verify').send( { token: token.value.trim(), uid: uID.value.trim() } ).end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            if (err && err.message && err.message.startsWith('[ERROR]') ) {
                error(err.slice('[ERROR] '.length) );
            } else {
                error(err || res.text);
            }
            resetForm();
            return false;
        }
        const succ = document.getElementsByClassName('successbox')[0];
        const success = document.getElementById('success');
        success.innerHTML = res.text.slice('[SUCCESS] '.length);
        succ.style.display = 'block';
        resetForm();
        return false;
    } );
}

function accept() {
    const token = document.getElementById('token');
    const uID = document.getElementById('uID');
    if (!uID.value || !token.value) {
        error('Missing user ID or token.');
        return false;
    }
    superagent.post('/api/verify').send( { token: token.value.trim(), uid: uID.value.trim() } ).end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            if (err && err.message && err.message.startsWith('[ERROR]') ) {
                error(err.slice('[ERROR] '.length) );
            } else {
                error(err || res.text);
            }
            resetForm();
            return false;
        }
        const succ = document.getElementsByClassName('successbox')[0];
        const success = document.getElementById('success');
        success.innerHTML = res.text.slice('[SUCCESS] '.length);
        succ.style.display = 'block';
        resetForm();
        return false;
    } );
}

