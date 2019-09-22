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


function load() {
    const div = document.getElementsByClassName('topnav')[0];
    superagent.get('/api/account')
        .end( (err, res) => {
            if (err) {
                console.log(err.message || err);
            }
            const eh = JSON.parse(res.text);
            if (eh.admin) {
                const li = document.createElement('li');
                const link = document.createElement('a');
                const linkText = document.createTextNode('Admin');
                link.href = '/admin';
                link.appendChild(linkText);
                li.appendChild(link);
                div.appendChild(li);
            }
        } );
}

function resetForm() {
    load();
    const uh = document.getElementById('form');
    uh.reset();
}

function unerror() {
    const box = document.getElementsByClassName('errbox')[0];
    const erName = document.getElementById('err');
    erName.innerHTML = '';
    box.style.display = 'none';
}

function deny() {
    unerror();
    const token = document.getElementById('token');
    const uID = document.getElementById('uID');
    if (!uID.value || !token.value) {
        error('Missing user ID or token.');
        return false;
    }
    superagent.delete('/api/verify').send( { token: token.value.trim(), uid: uID.value.trim() } ).end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            if (codes.includes(res.status) && res.text.startsWith('[ERROR]') ) {
                error(res.text.slice('[ERROR] '.length) );
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
    unerror();
    const token = document.getElementById('token');
    const uID = document.getElementById('uID');
    if (!uID.value || !token.value) {
        error('Missing user ID or token.');
        return false;
    }
    superagent.post('/api/verify').send( { token: token.value.trim(), uid: uID.value.trim() } ).end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            if (codes.includes(res.status) && res.text.startsWith('[ERROR]') ) {
                error(res.text.slice('[ERROR] '.length) );
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

