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
            if (eh.owner) {
                const li = document.createElement('li');
                const link = document.createElement('a');
                const linkText = document.createTextNode('Manage');
                link.href = '/owner/manage';
                link.appendChild(linkText);
                li.appendChild(link);
                div.appendChild(li);
            }
        } );
}

const noContent = 204;

let wut = [];

function unerror() {
    const box = document.getElementsByClassName('errbox')[0];
    const erName = document.getElementById('err');
    erName.innerHTML = '';
    box.style.display = 'none';
}

function unsuccess() {
    const box = document.getElementsByClassName('successbox')[0];
    const succ = document.getElementById('success');
    succ.innerHTML = '';
    box.style.display = '';
}

function deny(id) {
    unerror();
    unsuccess();
    const uh = wut.find(verify => verify.uid === id);
    const token = uh.token;
    const uID = uh.uid;
    const node = document.getElementById(id);
    if (!uID || !token) {
        error('Something happened and now I am confused');
        return false;
    }
    superagent.delete('/api/verify').send( { token, uid: uID } ).end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            if (codes.includes(res.status) && res.text.startsWith('[ERROR]') ) {
                error(res.text.slice('[ERROR] '.length) );
            } else {
                error(err || res.text);
            }
            return false;
        }
        const succ = document.getElementsByClassName('successbox')[0];
        const success = document.getElementById('success');
        success.innerHTML = res.text.slice('[SUCCESS] '.length);
        succ.style.display = 'block';
        node.parentNode.removeChild(node);
        wut = wut.filter(verify => verify.uid !== id);
        if (wut.length === 0) {
            const status = document.getElementById('status');
            status.innerHTML = 'No users!';
        }
        return false;
    } );
}

function accept(id) {
    unerror();
    unsuccess();
    const uh = wut.find(verify => verify.uid === id);
    const token = uh.token;
    const uID = uh.uid;
    const node = document.getElementById(id);
    if (!uID || !token) {
        error('Something happened and now I am confused');
        return false;
    }
    superagent.post('/api/verify').send( { token, uid: uID } ).end( (err, res) => {
        if (err || codes.includes(res.status) ) {
            if (codes.includes(res.status) && res.text.startsWith('[ERROR]') ) {
                error(res.text.slice('[ERROR] '.length) );
            } else {
                error(err || res.text);
            }
            return false;
        }
        const succ = document.getElementsByClassName('successbox')[0];
        const success = document.getElementById('success');
        success.innerHTML = res.text.slice('[SUCCESS] '.length);
        succ.style.display = 'block';
        node.parentNode.removeChild(node);
        wut = wut.filter(verify => verify.uid !== id);
        console.log(wut);
        if (wut.length === 0) {
            const status = document.getElementById('status');
            status.innerHTML = 'No users!';
        }
        return false;
    } );
}

function loadNotifications() {
    load();
    const parent = document.getElementsByClassName('verifys')[0];
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    superagent.get('/api/notifications?admin=true').end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            erbox.style.display = 'block';
            erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
            return;
        }
        const uh = document.getElementById('status');
        if (res.status === noContent || !res.text || !JSON.parse(res.text).length) {
            uh.innerHTML = 'No users!';
            return false;
        }
        uh.innerHTML = 'Pending Verifications:';
        const notifs = JSON.parse(res.text);
        for (let notify of notifs) {
            notify = JSON.parse(notify);
            const arr = [];
            const parsed = notify.notify.split(/,/g);
            for (const parse of parsed) {
                const pars = parse.split(': ')[1];
                arr.push(pars);
            }
            const obj = {
                name: arr[0],
                uid: arr[1],
                token: arr[2],
            };
            wut.push(obj);
            const eh = document.createElement('div');
            eh.className = 'verify';
            eh.id = obj.uid;
            if (wut.length > 1) {
                eh.innerHTML = `<br><br>Name: ${obj.name}<br>ID: ${obj.uid}<br>`;
            } else {
                eh.innerHTML = `Name: ${obj.name}<br>ID: ${obj.uid}<br>`;
            }
            const denyBtn = document.createElement('button');
            denyBtn.innerText = 'Deny';
            denyBtn.onclick = function () {
                deny(obj.uid);
            };
            eh.appendChild(denyBtn);
            const acceptBtn = document.createElement('button');
            acceptBtn.innerText = 'Accept';
            acceptBtn.onclick = function () {
                accept(obj.uid);
            };
            eh.appendChild(acceptBtn);
            eh.appendChild(document.createElement('br') );
            parent.appendChild(eh);
        }
    } );
}
