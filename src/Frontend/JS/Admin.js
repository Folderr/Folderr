function load() {
    const div = document.getElementsByClassName('topnav')[0];
    const li = document.createElement('li');
    const link = document.createElement('a');
    const linkText = document.createTextNode('Admin');
    link.href = '/admin';
    link.className = ' active';
    link.appendChild(linkText);
    li.appendChild(link);
    div.appendChild(li);
    superagent.get('/api/account')
        .end( (err, res) => {
            if (err) {
                console.log(err.message || err);
            }
            const eh = JSON.parse(res.text);
            if (eh.owner) {
                const li = document.createElement('li');
                const link = document.createElement('a');
                const linkText = document.createTextNode('Manage');
                link.href = '/owner/manage';
                link.appendChild(linkText);
                li.appendChild(link);
                div.appendChild(li);
            }
        } );
}
