function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    const match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

function downloadURI(uri, name)
{
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    link.click();
}

let token;

function loadnavbar() {
    $.ajax( {
        url: '/api/account', success: (data) => {
            if (data && data.owner) {
                $('#manage').removeAttr('id');
            }
            if (data && data.admin) {
                $('#admin').removeAttr('id');
            }
            const SConfig = {
                Name: 'Image.Evolve-X',
                DestinationType: 'ImageUploader',
                RequestMethod: 'POST',
                RequestURL: `${window.location.hostname}/api/image`,
                Headers: {
                    token: '',
                    uid: data.uID,
                },
                Body: 'MultipartFormData',
                FileFormName: 'image',
            };
            SConfig.Headers.token = qs('t');
            token = SConfig.Headers.token;
            const config = JSON.stringify(SConfig, null, 2).replace(/,/g, ',<br>');
            $('#uCode').html(config);
            $('#config').removeClass('hidden');
            $('#config').val(config);
            $('#config').addClass('hidden').delay(300);
            $('#noticetxt').text('Generated Config.');
        }, error: (eh, ehh, err) => {
            if (err === 'Unauthorized') {
                return;
            }
            console.log(`Uh, error: ${err || ehh}`);
        },
    } );
    $('#download').click( () => {
        $('.notice').removeClass('error');
        if (!token) {
            console.log('F');
            return;
        }
        const req = $.ajax( {
            url: '/api/config?d=true',
            data: { token },
            method: 'POST',
        } );
        req.done(result => {
            if (result.startsWith('[ERROR]') ) {
                $('#noticetxt').text(`Error: ${result.slice(8)}`);
                $('.notice').removeClass('hidden');
                $('.notice').addClass('error');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed');
                $('.notice').removeClass('hidden');
                $('.notice').addClass('error');
                return false;
            }

            const blob = new Blob( [result] );
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'Evolve-X.Config.sxcu';
            link.click();
        } );
        req.fail( (result) => {
            if (result.statusText === 'timeout') {
                $('#noticetxt').text('Request timed out.');
                $('.notice').removeClass('hidden');
                $('.notice').addClass('error');
                return false;
            }
            if (result.status === 401) {
                $('#noticetxt').text('Authorization failed.');
                $('.notice').removeClass('hidden');
                $('.notice').addClass('error');
                return false;
            }
            if (result.status === 200) {
                const blob = new Blob( [result] );
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = 'Evolve-X.Config.sxcu';
                link.click();
            }
        } );
    } );
    $('#copy').click(() => {
        const link = $('#config');
        link.removeClass('hidden');
        link.select();
        document.execCommand('copy');
        $('#noticetxt').text('Copied!');
        link.addClass('hidden');
    })
}
