const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

const noContent = 204;

function demote(id) {
    const req = $.ajax( {
        url: `/api/admin?id=${id}`,
        method: 'DELETE',
    } );
    req.done(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        const demoteBtn = document.getElementById(`demote_${id}`);
        const promoteBtn = document.createElement('button');
        promoteBtn.onclick = function () {
            promote(id);
        };
        promoteBtn.innerHTML = 'Promote';
        promoteBtn.id = `promote_${id}`;
        promoteBtn.className = 'smallBtn vBtn Accept';
        demoteBtn.parentNode.appendChild(promoteBtn);
        demoteBtn.parentNode.removeChild(demoteBtn);
        $('#noticetxt').text(`Demoted User`);
        $('.notice').removeClass('error');
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

function promote(id) {
    const req = $.ajax( {
        url: `/api/admin?id=${id}`,
        method: 'POST',
    } );
    req.done(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        const promoteBtn = document.getElementById(`promote_${id}`);
        const demoteBtn = document.createElement('button');
        demoteBtn.onclick = function () {
            demote(id);
        };
        demoteBtn.innerHTML = 'Demote';
        demoteBtn.id = `demote_${id}`;
        demoteBtn.className = 'smallBtn vBtn Accept';
        promoteBtn.parentNode.appendChild(demoteBtn);
        promoteBtn.parentNode.removeChild(promoteBtn);
        $('#noticetxt').text(`Promoted User`);
        $('.notice').removeClass('error');
    } );
    req.fail(result => {
        console.log('f');
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

function delAcc(id) {
    const req = $.ajax( {
        url: `/api/account?uid=${id}`,
        method: 'DELETE',
    } );
    req.done(result => {
        if (result.status && codes.includes(result.status) ) {
            $('#noticetxt').text(result.responseText.slice(8) );
            $('.notice').addClass('error');
            return;
        }
        const parent = document.getElementsByClassName('verifys')[0];
        const btn = document.getElementById(id);
        parent.removeChild(btn);
        $('#noticetxt').text(`Deleted user ${id}`);
        $('.notice').removeClass('error');
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

let title;

function loadNotifications(title) {
    const parent = document.getElementsByClassName('verifys')[0];
    const req = $.ajax( {
        url: '/api/users',
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
        let multiple;

        for (const user of result) {
            const el = document.createElement('div');
            el.className = ' user verify';
            el.id = user.uID;
            const userinfo = document.createElement('h3');
            userinfo.className = ' user';
            if (multiple) {
                userinfo.innerHTML = `<br><br>Username: ${user.username}<br>Images: ${user.images}<br>Shorts: ${user.shorts}<br>`;
            } else {
                multiple = true;
                userinfo.innerHTML = `<br><br>Username: ${user.username}<br>Images: ${user.images}<br>Shorts: ${user.shorts}<br>`;
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
                delAccBtn.className = 'smallBtn vBtn Deny';
                el.appendChild(delAccBtn);
            }
            if ( (!user.title || user.title.length === 0) && title === 'owner') {
                const promoteBtn = document.createElement('button');
                promoteBtn.onclick = function () {
                    promote(user.uID);
                };
                promoteBtn.id = `promote_${user.uID}`;
                promoteBtn.innerHTML = 'Promote';
                promoteBtn.className = 'smallBtn vBtn Accept';
                el.appendChild(promoteBtn);
            }
            if (user.title && user.title !== 'Owner' && title === 'owner') {
                const demoteBtn = document.createElement('button');
                demoteBtn.onclick = function () {
                    demote(user.uID);
                };
                demoteBtn.innerHTML = 'Demote';
                demoteBtn.id = `demote_${user.uID}`;
                demoteBtn.className = 'smallBtn vBtn Accept';
                el.appendChild(demoteBtn);
            }
            parent.appendChild(el);
        }
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
            if (data && data.admin) {
                $('#admin').removeAttr('id');
                title = 'admin';
            }
            if (data && data.owner) {
                $('#manage').removeAttr('id');
                title = 'owner';
            }
            loadNotifications(title);
        }, error: (eh, ehh, err) => {
            if (err === 'Unauthorized') {
                return;
            }
            console.log(`Uh, error: ${err || ehh}`);
        },
    } );
}
