let name;
let tokenGenerated = false;

function load() {
    $.ajax( {
        url: '/api/account', success: (data) => {
            if (data && data.owner) {
                $('#manage').removeAttr('id');
            }
            if (data && data.admin) {
                $('#admin').removeAttr('id');
            }
            $('#welcome').text(`Welcome, ${data.username}`);
            name = data.username;
            $('#shorts').text(`${data.shorts && data.shorts > 0 ? data.shorts : 'No'} Shortened links`);
            $('#images').text(`${data.images && data.images > 0 ? data.images : 'No'} Images`);
            if (data.token_generated) {
                tokenGenerated = true;
            }
        }, error: (eh, ehh, err) => {
            if (err === 'Unauthorized') {
                return;
            }
            console.log(`Uh, error: ${err || ehh}`);
        },
    } );
}

$(document).ready(() => {
    $('#u_btn').click( () => {
        if (!name) return false;
        const notice = $('.notice');
        notice.addClass('error');
        $('#noticetxt').text('An error occured.');
        notice.addClass('hidden');
        const password = $('#password').val();
        if (!password.length) {
            $('#noticetxt').text('Missing Password!');
            return;
        }
        const username = $('#username').val();
        if (!username.length) {
            $('#noticetxt').text('Missing Username!');
            notice.removeClass('hidden');
            return;
        }
        if (username === name) {
            $('#noticetxt').text('You already have that username');
            notice.removeClass('hidden');
            return;
        }

        const req = $.ajax({
            url: '/api/account?key=0',
            method: 'PATCH',
            data: { new_key: username },
            headers: { username: name, password },
        } );
        req.done( (result) => {
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed');
                $('.notice').removeClass('hidden');
                return false;
            }
            $('#noticetxt').text('Username updated.');
            notice.removeClass('error');
            notice.removeClass('hidden');
            $('#welcome').text(`Welcome, ${username}`);
            name = username;
            return false;
        } );
        req.fail((result) => {
            if (result.statusText === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 200) {
                $('#noticetxt').text('Username updated.');
                notice.removeClass('error');
                notice.removeClass('hidden');
                $('#welcome').text(`Welcome, ${username}`);
                name = username;
                return false;
            }
            console.log(result);
            $('.notice').removeClass('hidden');
            return false;
        });
        $('.notice').removeClass('hidden');
    } );
    $('#psw_btn').click( () => {
        if (!name) return false;
        const notice = $('.notice');
        notice.addClass('error');
        $('#noticetxt').text('An error occured.');
        notice.addClass('hidden');
        const password = $('#password').val();
        if (!password.length) {
            $('#noticetxt').text('Missing Password!');
            notice.removeClass('hidden');
            return;
        }
        const nPass = $('#nPassword').val();
        if (!nPass.length) {
            $('#noticetxt').text('Missing new password!');
            notice.removeClass('hidden');
            return;
        }
        if (password === nPass) {
            $('#noticetxt').text('You already use that password');
            notice.removeClass('hidden');
            return;
        }
        if (password.match(name) ) {
            $('#noticetxt').text('You cannot include your name in the password');
            notice.removeClass('hidden');
            return;
        }

        const req = $.ajax({
            url: '/api/account?key=1',
            method: 'PATCH',
            data: { new_key: nPass },
            headers: { username: name, password },
        } );
        req.done( (result) => {
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed');
                $('.notice').removeClass('hidden');
                return false;
            }
            $('#noticetxt').text('Password updated.');
            notice.removeClass('error');
            notice.removeClass('hidden');
            return false;
        } );
        req.fail( (result) => {
            if (result.statusText === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 200) {
                $('#noticetxt').text('Password updated.');
                notice.removeClass('error');
                notice.removeClass('hidden');
                return false;
            }
            $('.notice').removeClass('hidden');
            return false;
        });
        $('.notice').removeClass('hidden');
    } );
    $('#cancel').click( () => {
        if (!name) return false;
        $('#cancel').addClass('hidden');
        $('#confirm').addClass('hidden');
        $('#ok').removeClass('hidden');
        $('#sure_text').text('Cancelled updating your token!');
    } );
    $('#ok').click(() => {
        if (!name) return false;
        $('#sure').addClass('hidden');
        $('#sure_text').text('Are you sure you want to reset your token? The previous one will no longer be usable.');
        $('#ok').addClass('hidden');
        $('#copy_tkn').addClass('hidden');
        $('#cancel').addClass('hidden');
        $('#confirm').addClass('hidden');
        $('.notice').addClass('hidden');
    } );
    $('#token').click( () => {
        $('#sure').addClass('hidden');
        $('#sure_text').text('Are you sure you want to reset your token? The previous one will no longer be usable.');
        $('#ok').addClass('hidden');
        $('#copy_tkn').addClass('hidden');
        $('#cancel').addClass('hidden');
        $('#confirm').addClass('hidden');
        $('.notice').addClass('hidden');
        if (!name) return false;
        const notice = $('.notice');
        notice.addClass('error');
        $('#noticetxt').text('An error occured.');
        const password = $('#password').val();
        if (!password.length) {
            $('#noticetxt').text('Missing Password!');
            return;
        }
        if (tokenGenerated) {
            $('#cancel').removeClass('hidden');
            $('#confirm').removeClass('hidden');
            $('#sure').removeClass('hidden');
            return false;
        }
        const req = $.ajax({
            url: '/api/token',
            headers: { username: name, password },
        } );
        req.done( (result) => {
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed');
                $('.notice').removeClass('hidden');
                return false;
            }
            $('#noticetxt').text('Reset token');
            notice.removeClass('error');
            notice.removeClass('hidden');
            $('#tkn').val(result);
            $('#sure_text').text('');
            $('#copy_tkn').removeClass('hidden');
            $('#ok').removeClass('hidden');
            $('#sure').removeClass('hidden');
            return false;
        } );
        req.fail( (result) => {
            if (result.statusText === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 200) {
                $('#noticetxt').text('Reset token');
                notice.removeClass('error');
                notice.removeClass('hidden');
                $('#tkn').val(result.responseText);
                $('#sure_text').text('');
                $('#ok').removeClass('hidden');
                $('#copy_tkn').removeClass('hidden');
                $('#sure').removeClass('hidden');
                return false;
            }
            notice.removeClass('hidden');
            return false;
        });
        $('.notice').removeClass('hidden');
    } );
    $('#confirm').click( () => {
        if (!name) return false;
        console.log('Ok');
        $('#confirm').addClass('hidden');
        $('#cancel').addClass('hidden');
        const notice = $('.notice');
        notice.addClass('error');
        $('#noticetxt').text('An error occured.');
        const password = $('#password').val();
        if (!password.length) {
            $('#noticetxt').text('Missing Password!');
            return;
        }
        console.log('Sending req');
        const req = $.ajax({
            url: '/api/token?flags=force',
            headers: { username: name, password },
            method: 'POST',
        } );
        req.done( (result) => {
            console.log('Req success');
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed');
                $('.notice').removeClass('hidden');
                return false;
            }
            $('#noticetxt').text('Reset token');
            notice.removeClass('error');
            notice.removeClass('hidden');
            $('#tkn').val(result);
            $('#sure_text').text('');
            $('#ok').removeClass('hidden');
            $('#copy_tkn').removeClass('hidden');
            $('#sure').removeClass('hidden');
            return false;
        } );
        req.fail( (result) => {
            console.log('Req fail');
            console.log(result);
            if (result.statusText === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed.');
                $('.notice').removeClass('hidden');
                return false;
            }
            if (result.status === 200) {
                $('#noticetxt').text('Reset token');
                notice.removeClass('error');
                notice.removeClass('hidden');
                $('#tkn').val(result.responseText);
                $('#sure_text').text('');
                $('#ok').removeClass('hidden');
                $('#copy_tkn').removeClass('hidden');
                $('#sure').removeClass('hidden');
                return false;
            }
            notice.removeClass('hidden');
            return false;
        });
        $('.notice').removeClass('hidden');
    })
    $('#copy_tkn').click( () => {
        if (!name) return false;
        const tkn = $('#tkn');
        tkn.removeClass('hidden');
        tkn.select();
        document.execCommand('copy');
        $('#noticetxt').text('Copied!');
        tkn.addClass('hidden');
    } );
    $('form').submit((ev) => ev.preventDefault());
})
