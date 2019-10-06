let title,
    uID;

const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

function getAccount() {
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    erName.innerHTML = '';
    erbox.style.display = 'none';
    superagent.get('/api/account')
        .end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            const eh = JSON.parse(res.text);
            if (eh.owner) {
                title = 'owner';
            } else {
                title = 'admin';
            }
            uID = eh.uID;
        } );
}

let multiple = false;

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

function delAcc(id) {
    unsuccess();
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    superagent.delete(`/api/account?uid=${id}`).end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            erbox.style.display = 'block';
            erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
            return;
        }
        const btn = document.getElementById(`delete_${id}`);
        const usersDiv = document.getElementsByClassName('users')[0];
        usersDiv.removeChild(btn.parentNode);
        success(`Deleted user ${id}`);
    } );
}

function promote(id) {
    unsuccess();
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    superagent.post(`/api/admin?id=${id}`).end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            erbox.style.display = 'block';
            erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
            return;
        }
        const promoteBtn = document.getElementById(`promote_${id}`);
        const demoteBtn = document.createElement('button');
        demoteBtn.onclick = function () {
            demote(id);
        };
        demoteBtn.innerHTML = 'Demote from Admin';
        demoteBtn.id = `demote_${id}`;
        demoteBtn.style.marginLeft = '1%';
        promoteBtn.parentNode.appendChild(demoteBtn);
        promoteBtn.parentNode.removeChild(promoteBtn);
        success(`Promoted user ${id}`);
    } );
}

function demote(id) {
    unsuccess();
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    superagent.delete(`/api/admin?id=${id}`).end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            erbox.style.display = 'block';
            erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
            return;
        }
        const demoteBtn = document.getElementById(`demote_${id}`);
        const promoteBtn = document.createElement('button');
        promoteBtn.onclick = function () {
            promote(id);
        };
        promoteBtn.innerHTML = 'Promote to Admin';
        promoteBtn.id = `promote_${id}`;
        promoteBtn.style.marginLeft = '1%';
        demoteBtn.parentNode.appendChild(promoteBtn);
        demoteBtn.parentNode.removeChild(demoteBtn);
        success(`Demoted user ${id}`);
    } );
}

function getUsers() {
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    const usersDiv = document.getElementsByClassName('users')[0];
    const status = document.getElementById('status');
    superagent.get('/api/users').end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            erbox.style.display = 'block';
            erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
            return;
        }
        const out = JSON.parse(res.text);
        for (const user of out) {
            const el = document.createElement('div');
            el.className = ' user';
            el.id = user.uID;
            const userinfo = document.createElement('h3');
            userinfo.className = ' user';
            if (multiple) {
                userinfo.innerHTML = `<br><br>Username: ${user.username}<br>Images: ${user.images}<br>Shorts: ${user.shorts}<br>`;
            } else {
                multiple = true;
                userinfo.innerHTML = `Username: ${user.username}<br>Images: ${user.images}<br>Shorts: ${user.shorts}<br>`;
            }
            if (user.title.length !== 0) {
                userinfo.innerHTML += `Title: ${user.title}<br>`;
            }
            el.appendChild(userinfo);
            if (!user.title || (user.title === 'Admin' && title === 'owner') ) {
                const delAccBtn = document.createElement('button');
                delAccBtn.onclick = function () {
                    delAcc(user.uID);
                };
                delAccBtn.innerHTML = 'Delete';
                delAccBtn.id = `delete_${user.uID}`;
                el.appendChild(delAccBtn);
            }
            if ( (!user.title || user.title.length === 0) && title === 'owner') {
                const promoteBtn = document.createElement('button');
                promoteBtn.onclick = function () {
                    promote(user.uID);
                };
                promoteBtn.id = `promote_${user.uID}`;
                promoteBtn.innerHTML = 'Promote to Admin';
                promoteBtn.style.marginLeft = '1%';
                el.appendChild(promoteBtn);
            }
            if (user.title && user.title !== 'Owner' && title === 'owner') {
                const demoteBtn = document.createElement('button');
                demoteBtn.onclick = function () {
                    demote(user.uID);
                };
                demoteBtn.innerHTML = 'Demote from Admin';
                demoteBtn.id = `demote_${user.uID}`;
                demoteBtn.style.marginLeft = '1%';
                el.appendChild(demoteBtn);
            }
            usersDiv.appendChild(el);
        }
        status.innerHTML = 'Users:';
    } );
}

function load() {
    getAccount();
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
    getUsers();
}
