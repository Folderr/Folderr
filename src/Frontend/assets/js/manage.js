$(document).ready(function () {
    (function () {
        $.get('/api/info', (result) => {
            let str = `Git Commit: ${result.commit.replace(' ', ',\n')}\nEvolve-X branch: ${result.branch}`;
            if (result.version) {
                str += `\n\nInstance Version: ${result.version}`;
            }
            const eh = $('#gitinfo').text(str);
            eh.html(eh.html().replace(/\n/g, '<br/>') );
        } );
    } )();

    $('#typescript').click( () => {
        $('#noticetxt').text('Running Typescript Transpiler. This may take a few minutes, give or take.');
        $.post('/api/manage?type=t', (result) => {
            if (typeof result === 'string' && result.startsWith('[ERROR] Authorization failed') ) {
                return $(location).attr('href', '/');
            }
            $('#noticetxt').text('Typescript Transpiler running!');
        } );
    } );

    $('#update').click( () => {
        $('#noticetxt').text('Updating source code... This may take a few minutes, give or take.');
        $.post('/api/manage?type=u', () => {
            $('#noticetxt').text('Updating, this will happen in the background');
            $.get('/api/info', (result) => {
                let str = `Git Commit: ${result.commit.replace(' ', ',\n')}\nEvolve-X branch: ${result.branch}`;
                if (result.version) {
                    str += `\n\nInstance Version: ${result.version}`;
                }
                const eh = $('#gitinfo').text(str);
                eh.html(eh.html().replace(/\n/g, '<br/>') );
            } );
        } );
    } );

    $('#stop').click( () => {
        $('#noticetxt').text('Stopping Folderr-X.');
        $.post('/api/manage?type=s', (result) => {
            if (typeof result === 'string' && result.startsWith('[ERROR] Authorization failed') ) {
                $(location).attr('href', '/');
            }
        } );
    } );
} );
