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

function success(msg) {
    const box = document.getElementsByClassName('successbox')[0];
    const succ = document.getElementById('success');
    succ.innerHTML = msg;
    box.style.display = 'block';
}

function unsuccess() {
    const box = document.getElementsByClassName('successbox')[0];
    const succ = document.getElementById('success');
    succ.innerHTML = '';
    box.style.display = '';
}

function tsc() {
    unsuccess();
    unerror();
    superagent.post('/api/manage?type=t').end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            error(res.text.slice('[ERROR]'.length) || err);
            return false;
        }
        success('Compiled!');
    } );
}

function update() {
    unerror();
    unsuccess();
    superagent.post('/api/manage?type=u').end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            error(res.text.slice('[ERROR]'.length) || err);
            return false;
        }
        success('Updated! Restart to see changes.');
    } );
}

function stop() {
    unerror();
    unsuccess();
    superagent.post('/api/manage?type=s').end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            error(res.text.slice('[ERROR]'.length) || err);
            return false;
        }
        success(res.text);
    } );
}

function loadInfo() {
    const infoParent = document.getElementsByClassName('info')[0];
    superagent.get('/api/info').end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            error(res.text.slice('[ERROR]'.length) || err);
            return false;
        }
        const information = JSON.parse(res.text);
        const i = document.createElement('h1');
        i.innerHTML = 'Git info';
        infoParent.appendChild(i);
        const info = document.createElement('h4');
        info.innerHTML = `Commit: ${information.commit}<br>Branch: ${information.branch}`;
        infoParent.appendChild(info);
    } );
}

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
            if (eh.owner) {
                const li = document.createElement('li');
                const link = document.createElement('a');
                const linkText = document.createTextNode('Manage');
                link.href = '/owner/manage';
                link.appendChild(linkText);
                link.className = ' active';
                li.appendChild(link);
                div.appendChild(li);
            }
        } );
    loadInfo();
}
