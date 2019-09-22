function load() {
    const div = document.getElementsByClassName('left-block')[0];
    superagent.get('/api/account')
        .end( (err, res) => {
            if (err) {
                console.log(err.message || err);
            }
            const eh = JSON.parse(res.text);
            if (eh.admin) {
                div.innerHTML += '<br><br>';
                const link = document.createElement('a');
                const linkText = document.createTextNode('Admin Hub');
                link.href = '/admin';
                link.appendChild(linkText);
                div.appendChild(link);
            }
        } );
}
