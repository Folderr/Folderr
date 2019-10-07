$(document).ready( () => {
    $('.send').click( () => {
        $('#noticetxt').removeClass('stext');
        $('#noticetxt').text('Signups must be accepted by an admin');
        $('.notice').removeClass('error');
        const password = $('#password').val();
        const aPass = $('#retype-password').val();
        if (!password.length || !aPass.length) {
            $('#noticetxt').text('Missing Password(s)!');
            $('.notice').addClass('error');
            return;
        }
        if (password !== aPass) {
            $('#noticetxt').text('Passwords do not match!');
            $('.notice').addClass('error');
            return;
        }
        const username = $('#username').val();
        if (!username.length) {
            $('#noticetxt').text('Missing Username!');
            $('.notice').addClass('error');
            return;
        }

        // Minimum and max password lengths
        const minPass = 8;
        const maxPass = 32;
        // If the password is not over min length
        // If password does not match the regex completely
        const match = password.match(/[A-Za-z0-9_.&]/g);
        if (password.length < minPass || (match && match.length !== password.length) ) {
            $('#noticetxt').text('Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`');
            $('#noticetxt').addClass('stext');
            $('.notice').addClass('error');
            return false;
        }
        // If the password is too long
        if (password.length > maxPass) {
            $('#noticetxt').text('Password is too long, password must be under 32 characters long');
            $('.notice').addClass('error');
            return false;
        }
        // Max and min username lengths
        const maxUsername = 12;
        const minUsername = 3;
        // If the username length does not match criteria
        if (username.length > maxUsername || username.length < minUsername) {
            $('#noticetxt').text('Username must be between 3 and 12 characters!');
            $('.notice').addClass('error');
            return false;
        }
        if (username.length !== username.match(/[a-z0-9_]/g).length) { // If the username doess not match our username pattern
            $('#noticetxt').text('Username may only contain lowercase letters, numbers, and an underscore.');
            $('#noticetxt').addClass('stext');
            $('.notice').addClass('error');
            return false;
        }
        $.post('/api/signup', { username, password }, (result, status, xhr) => {
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').addClass('error');
                return false;
            }
            if (status === 'error') {
                $('#noticetxt').text('An error occurred.');
                $('.notice').addClass('error');
                return false;
            }
            if (status === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').addClass('error');
                return false;
            }
            $('#noticetxt').text('Your request has been sent to the admins!');
        } );
    } );
    $('form').on('reset', () => {
        $('#noticetxt').removeClass('stext');
        $('#noticetxt').text('Signups must be accepted by an admin');
        $('.notice').removeClass('error');
    } );
} );
