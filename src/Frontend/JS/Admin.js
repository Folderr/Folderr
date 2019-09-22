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
};
