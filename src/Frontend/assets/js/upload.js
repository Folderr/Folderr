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
    $("#uploadBtn").change( () => {
        $('.notice').removeClass('error');
        const f = $('#uploadBtn')[0];
        if (f.files.length > 1) {
            $('#noticetxt').text('1 file at a time!');
            $('.notice').addClass('error');
            return false;
        }
        $('#noticetxt').text('Uploading...');
        superagent.post('/api/image').attach('image', f.files[0], f.files[0].name).end( (err, res) => {
            if (err || (res && codes.includes(res.status) ) ) {
                if (res.text) {
                    $('#noticetxt').text(res.text.slice('[ERROR] '.length) );
                    $('.notice').addClass('error');
                    return false;
                }
                $('#noticetxt').text(err.message);
                $('.notice').addClass('error');
                return false;
            }
            $('#noticetxt').text(res.text);
            $('#img').val(res.text);
            $('#linkHolder').removeClass('hidden');
        } );
    } );

    $('#copy').click( () => {
        $('#img').removeClass('hidden');
        $('#img').select();
        document.execCommand('copy');
        $('#noticetxt').text('Copied!');
        $('.notice').removeClass('error');
        $('#img').addClass('hidden');
    } );
} );
