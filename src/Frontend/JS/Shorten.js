let cookies = document.cookie;
cookies = cookies.split('; ');
const aCookies = {};

for (let cookie of cookies) {
    cookie = cookie.split('=');
    aCookies[cookie[0]] = cookie[1];
}

const notFound = 404;
const unauthorized = 401;
const badReq = 400;

const codes = [
    notFound,
    unauthorized,
    badReq,
];

function copy() {
    const link = document.getElementById('shorts');
    link.select();
    link.setSelectionRange(0, 99999);
    const box = document.getElementsByClassName('successbox')[0];
    const succ = document.getElementById('success');

    document.execCommand('copy');
    succ.innerHTML = `Copied: ${link.value}!`;
    box.style.display = 'block';
}

function req() {
    const erName = document.getElementById('err');
    const erbox = document.getElementsByClassName('errbox')[0];
    erName.innerHTML = '';
    erbox.style.display = 'none';
    const url = document.getElementById('url');
    const form = document.getElementsByClassName('form');
    const shorts = document.getElementById('shorts');
    if (!url.value) {
        erbox.style.display = 'block';
        return erName.innerHTML = 'User Error: URL not given!<br>Error Code: 1D10T';
    }
    superagent.post('/api/short')
        .send( { url: url.value } )
        .end( (err, res) => {
            console.log(res.req);
            if (err || (res && codes.includes(res.status) ) ) {
                erbox.style.display = 'block';
                erName.innerHTML = `An error occurred: ${err.response.text.slice('[ERROR] '.length)}`;
                return;
            }
            shorts.innerText = res.text;
            shorts.value = res.text;
            shorts.style.display = 'block';
            const btn = document.getElementsByClassName('hideBtn')[0];
            btn.style.display = 'block';
        } );
    form[0].reset();
}
