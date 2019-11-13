let name;
let tokenGenerated = false;
let owner = false;
let txt = 'Are you sure you want to reset your token? The previous one will no longer be usable.';

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
            $('#id').text(`ID: ${data.uID}`)
            owner = data.owner;
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
        $('#dconfirm').addClass('hidden');
        $('#confirm_name').addClass('hidden');
        $('#ok').removeClass('hidden');
        if (txt && txt === 'Are you sure you want to delete your account? Any information on your account will be permanently lost.') {
            $('#sure_text').text('Cancelled deleting your account!');
            return false;
        }
        $('#sure_text').text('Cancelled updating your token!');
        return false;
    } );
    $('#ok').click(() => {
        if (!name) return false;
        $('#sure').addClass('hidden');
        $('#sure_text').text('Are you sure you want to reset your token? The previous one will no longer be usable.');
        txt = 'Are you sure you want to reset your token? The previous one will no longer be usable.';
        $('#ok').addClass('hidden');
        $('#copy_tkn').addClass('hidden');
        $('#cancel').addClass('hidden');
        $('#confirm').addClass('hidden');
        $('#dconfirm').addClass('hidden');
        $('.notice').addClass('hidden');
    } );
    $('#token').click( () => {
        $('#sure').addClass('hidden');
        $('#sure_text').text('Are you sure you want to reset your token? The previous one will no longer be usable.');
        txt = 'Are you sure you want to reset your token? The previous one will no longer be usable.';
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
        if (!password || !password.length) {
            $('#noticetxt').text('Missing Password!');
            $('.notice').removeClass('hidden');
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
            method: 'POST',
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
        const req = $.ajax({
            url: '/api/token?flags=force',
            headers: { username: name, password },
            method: 'POST',
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
            $('#ok').removeClass('hidden');
            $('#copy_tkn').removeClass('hidden');
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
    $('#del').click( () => {
        if (!name) return false;
        if (owner) {
            $('.notice').addClass('error');
            $('#noticetxt').text('You\'re the owner. Your account cannot be deleted.');
            $('.notice').removeClass('hidden');
            return false;
        }
        alert('NOTICE: Deleting your account is permanent and cannot be undone. No data can be recovered from that point.');
        $('#sure_text').text('Are you sure you want to delete your account? Any information on your account will be permanently lost.');
        txt = 'Are you sure you want to delete your account? Any information on your account will be permanently lost.';
        $('#cancel').removeClass('hidden');
        $('#dconfirm').removeClass('hidden');
        $('#confirm_name').removeClass('hidden');
        $('#sure').removeClass('hidden');
    } );
    $('#dconfirm').click( () => {
        if (!name) {
            return false;
        }
        const cUsername = $('#confirm_name').val();
        if (!cUsername || cUsername !== name) {
            $('.notice').addClass('error');
            $('.notice').removeClass('hidden');
            $('#noticetxt').text('Confirmation failed');
            return false;
        }
        alert('Goodbye.');
        const req = $.ajax({
            url: '/api/account',
            method: 'DELETE',
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
            $(location).attr('href', '/logout?d=t');
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
                $(location).attr('href', '/logout?d=t');
                return false;
            }
            $('#noticetxt').text('An error occurred.');
            $('.notice').removeClass('hidden');
            return false;
        } );
    } );
    $('#configGen').click( () => {
        const tkn = $('#tkn').val();
        if (!tkn) {
            location.href = '/config';
            return;
        }
        location.href = `/config?t=${tkn}`;
    } );
    $('form').submit((ev) => ev.preventDefault());
})
