$(document).ready( () => {
    $('.send').click( () => {
        $('#noticetxt').text('Invalid Login Details');
        $('.notice').addClass('hidden');
        $('#formContainer').removeClass('mysm-auto');
        const password = $('#password').val();
        if (!password.length) {
            $('#noticetxt').text('Missing Password(s)!');
            $('.notice').removeClass('hidden');
            $('#formContainer').addClass('mysm-auto');
            return;
        }
        const username = $('#username').val();
        if (!username.length) {
            $('#noticetxt').text('Missing Username!');
            $('.notice').removeClass('hidden');
            $('#formContainer').addClass('mysm-auto');
            return;
        }

        // Minimum and max password lengths
        const minPass = 8;
        const maxPass = 32;
        // If the password is not over min length
        // If password does not match the regex completely
        const match = password.match(/[A-Za-z0-9_.&]/g);
        if (password.length < minPass || (match && match.length !== password.length) || password.length > maxPass) {
            console.log('inv pass');
            $('#noticetxt').text('Invalid Password');
            $('.notice').removeClass('hidden');
            $('#formContainer').addClass('mysm-auto');
            return false;
        }
        // Max and min username lengths
        const maxUsername = 12;
        const minUsername = 3;
        // If the username length does not match criteria
        if (username.length > maxUsername || username.length < minUsername || username.length !== username.match(/[a-z0-9_]/g).length) {
            console.log('inv u');
            $('#noticetxt').text('Invalid Username');
            $('.notice').removeClass('hidden');
            $('#formContainer').addClass('mysm-auto');
            return false;
        }
        const req = $.ajax( {
            url: '/api/login',
            data: { username, password },
            method: 'POST',
            timeout: 5000,
        } );
        req.done( (result) => {
            console.log(result);
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').removeClass('hidden');
                $('#formContainer').addClass('mysm-auto');
                return false;
            }
            if (result.status === 401) {
                $('.notice').removeClass('hidden');
                $('#formContainer').addClass('mysm-auto');
                return false;
            }
            $(location).attr('href', '/');
            return false;
        } );
        req.fail( (result) => {
            if (result.statusText === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').removeClass('hidden');
                $('#formContainer').addClass('mysm-auto');
                return false;
            }
            if (result.status === 401) {
                $('.notice').removeClass('hidden');
                $('#formContainer').addClass('mysm-auto');
                return false;
            }
            if (result.status === 200) {
                $(location).attr('href', '/');
                return false;
            }
            $('#noticetxt').text('An error occurred.');
            $('.notice').removeClass('hidden');
            $('#formContainer').addClass('mysm-auto');
            return false;
        } );
    } );
    $('form').on('reset', () => {
        $('#noticetxt').text('Invalid Login Details');
        $('.notice').addClass('hidden');
        $('#formContainer').removeClass('mysm-auto');
    } );
} );
