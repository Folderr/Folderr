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

function load() {
    reset();
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


function reset() {
    load();
    const form = document.getElementById('iForm');
    form.reset();
    return false;
}

async function upload() {
    unerror();
    const { files } = document.getElementById('file');
    if (!files.length) {
        error('Missing file!');
        return false;
    }
    if (files.length > 1) {
        error('You can only upload 1 file at a time.');
        return false;
    }
    const img = document.getElementById('img');
    superagent.post('/api/image').attach('image', files[0], files[0].name).end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            if (res.text) {
                error(res.text.slice('[ERROR] '.length) );
                return false;
            }
            error(err.message);
            return false;
        }
        img.value = res.text;
        img.style.display = 'block';
        const btn = document.getElementsByClassName('hideBtn')[0];
        btn.style.display = 'block';
        reset();
        return false;
    } );
    return false;
}

function copy() {
    const link = document.getElementById('img');
    link.select();
    link.setSelectionRange(0, 99999);
    const box = document.getElementsByClassName('successbox')[0];
    const succ = document.getElementById('success');

    document.execCommand('copy');
    succ.innerHTML = `Copied: ${link.value}!`;
    box.style.display = 'block';
    return false;
}
