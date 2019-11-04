$(document).ready(function () {
    (function () {
        if (!document.cookie) {
            $(location).attr('href', '/');
        }
        $.get('/api/info', (result) => {
            if (typeof result === 'string' && result.startsWith('[ERROR] Authorization failed') ) {
                // $(location).attr('href', '/');
                // return;
            }
            const eh = $('#gitinfo').text(`Git Commit: ${result.commit.replace(' ', ',\n')}\nEvolve-X branch: ${result.branch}`);
            eh.html(eh.html().replace(/\n/g, '<br/>') );
        } );
    } )();

    $('#typescript').click( () => {
        $('#noticetxt').text('Running Typescript Transpiler. This may take a few minutes, give or take.');
        $.post('/api/manage?type=t', (result) => {
            if (typeof result === 'string' && result.startsWith('[ERROR] Authorization failed') ) {
                return $(location).attr('href', '/');
            }
            $('#noticetxt').text('Typescript Transpiler ran!');
        } );
    } );

    $('#update').click( () => {
        $('#noticetxt').text('Updating source code... This may take a few minutes, give or take.');
        $.post('/api/manage?type=u', () => {
            $('#noticetxt').text('Updated!');
            $.get('/api/info', (result) => {
                const eh = $('#gitinfo').text(`Git Commit: ${result.commit.replace(' ', ',\n')}\nEvolve-X branch: ${result.branch}`);
                eh.html(eh.html().replace(/\n/g, '<br/>') );
            } );
        } );
    } );

    $('#stop').click( () => {
        $('#noticetxt').text('Stopping Evolve-X.');
        $.post('/api/manage?type=s', (result) => {
            if (typeof result === 'string' && result.startsWith('[ERROR] Authorization failed') ) {
                $(location).attr('href', '/');
            }
        } );
    } );
} );
