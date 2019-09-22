const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

const noContent = 204;

function loadNotifications() {
    const parent = document.getElementsByClassName('notificationsDiv')[0];
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    superagent.get('/api/notifications?admin=true').end( (err, res) => {
        if (err || (res && codes.includes(res.status) ) ) {
            erbox.style.display = 'block';
            erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
            return;
        }
        const uh = document.getElementById('status');
        if (res.status === noContent || !res.text) {
            uh.innerHTML = 'No notifications!';
            return false;
        }
        uh.innerHTML = 'Notifications:';
        const notifs = JSON.parse(res.text);
        for (let notify of notifs) {
            console.log(notify);
            notify = JSON.parse(notify);
            console.log(typeof notify);
            console.log(notify.notify);
            const el = document.createElement('DIV');
            el.className = ' notification';
            el.innerHTML = `Title: ${notify.title}<br>Notification:<br>${notify.notify.replace(/,/g, '<br>')}<p>ID: ${notify.ID}`;
            parent.appendChild(el);
        }
    } );
}
