const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

const noContent = 204;

let wut = [];

function deny(id) {
    console.log(`Deny ${id}`);
    const uh = wut.find(verify => verify.uid === id);
    const token = uh.token;
    const uID = uh.uid;
    if (!uID || !token) {
        $('#noticetxt').text('Something was missing. Reload.');
        $('.notice').addClass('error');
        return false;
    }
    const req = $.ajax( {
        url: '/api/verify',
        data: { token, uid: uID },
        method: 'DELETE',
    } );
    req.done(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        $('#noticetxt').text('Denied User');
        $(`#${id}`).remove();
        $('.notice').removeClass('error');
        wut = wut.filter(verify => verify.uid !== id);
        if (!wut.length) {
            $('#noticetxt').text('No more users!').delay(3000);
        }
    } );
    req.fail(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        $('#noticetxt').text('An unexpected error occurred.');
        $('.notice').adddClass('error');
        return false;
    } );
}

function accept(id) {
    console.log(`Accept ${id}`);
    const uh = wut.find(verify => verify.uid === id);
    const token = uh.token;
    const uID = uh.uid;
    if (!uID || !token) {
        $('#noticetxt').text('Something was missing. Reload.');
        $('.notice').addClass('error');
        return false;
    }
    const req = $.ajax( {
        url: '/api/verify',
        data: { token, uid: uID },
        method: 'POST',
    } );
    req.done(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        $('#noticetxt').text('Accepted User');
        $(`#${id}`).remove();
        $('.notice').removeClass('error');
        wut = wut.filter(verify => verify.uid !== id);
        if (!wut.length) {
            $('#noticetxt').text('No more users!').delay(3000);
        }
    } );
    req.fail(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        $('#noticetxt').text('An unexpected error occurred.');
        $('.notice').adddClass('error');
        return false;
    } );
}

function loadNotifications() {
    const parent = document.getElementsByClassName('verifys')[0];
    const req = $.ajax( {
        url: '/api/notifications?admin=true',
    } );
    req.done( (result) => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        if (!result.length || result.length === 0) {
            $('#noticetxt').text('No users found.');
        }

        for (let notify of result) {
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
            eh.className = `verify`;
            eh.id = obj.uid;
            if (wut.length > 1) {
                eh.innerHTML = `<br>Name: ${obj.name}<br>ID: ${obj.uid}<br>`;
            } else {
                eh.innerHTML = `<br>Name: ${obj.name}<br>ID: ${obj.uid}<br>`;
            }
            const denyBtn = document.createElement('button');
            denyBtn.innerText = 'Deny';
            denyBtn.onclick = function () {
                deny(obj.uid);
            };
            denyBtn.className = 'smallBtn vBtn Deny';
            eh.appendChild(denyBtn);
            const acceptBtn = document.createElement('button');
            acceptBtn.innerText = 'Accept';
            acceptBtn.onclick = function () {
                accept(obj.uid);
            };
            acceptBtn.className = 'smallBtn vBtn Accept';
            eh.appendChild(acceptBtn);
            eh.appendChild(document.createElement('br') );
            parent.appendChild(eh);
        }
        const b = document.createElement('br');
        $('#noticetxt').text(`${result.length} users loaded!`);
    } );
    req.fail(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        $('#noticetxt').text('An unexpected error occurred.');
        $('.notice').adddClass('error');
        return false;
    } );
}

function loadnavbar() {
    $.ajax( {
        url: '/api/account', success: (data) => {
            if (!data || !data.admin) {
                $(location).attr('href', '/');
            }
            if (data && data.owner) {
                $('#manage').removeAttr('id');
            }
            if (data && data.admin) {
                $('#admin').removeAttr('id');
            }
        }, error: (eh, ehh, err) => {
            if (err === 'Unauthorized') {
                return;
            }
            console.log(`Uh, error: ${err || ehh}`);
        },
    } );
    loadNotifications();
}
