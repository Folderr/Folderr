function loadnavbar() {
    $.ajax( {
        url: '/api/account', success: (data) => {
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


$(document).ready( () => {
    (function() {
        $('#shortenForm').trigger('reset');
    }() );
    $('#shorten').click( () => {
        const notice = $('.notice');
        const txt = $('#noticetxt');
        notice.removeClass('error');
        const link = $('#link').val();
        if (!link) {
            notice.addClass('error');
            txt.text('Uh, what link?');
            return false;
        }
        txt.text('Shortening...');
        const req = $.ajax( {
            url: '/api/short',
            method: 'POST',
            data: { url: link },
        } );
        req.done( (result) => {
            if (result.startsWith('[ERROR]') ) {
                txt.text(`Error: ${result.slice(8)}`);
                notice.addClass('error');
                return false;
            }
            notice.removeClass('hidden');
            $('#linkHolder').removeClass('hidden');
            $('#linkOut').val(result);
            txt.text(result);
            $('#shortenForm').trigger('reset');
            return false;
        } );
        req.fail( (result) => {
            $('#linkHolder').addClass('hidden');
            if (result.responseText.startsWith('[ERROR]') ) {
                txt.text(`Error: ${result.responseText.slice(8)}`);
                notice.addClass('error');
                return false;
            }
            if (result.statusText === 'timeout') {
                txt.text('Request timed out.');
                notice.addClass('error');
                return false;
            }
            txt.text('An error occurred.');
            notice.addClass('error');
            return false;
        } );
    } );

    $('#resetBtn').click( () => {
        $('#shortenForm')[0].reset();
    } );

    $('#copy').click( () => {
        const link = $('#linkOut');
        link.removeClass('hidden');
        link.select();
        document.execCommand('copy');
        $('#noticetxt').text('Copied!');
        link.addClass('hidden');
    } );
} );
