## Lets talk about Evolve-X's paths..

In the demos below we will be using superagent

# Notes on the API

If there was an error while processing your request the response text should start with `[ERROR]`.

If the API was successful it should return `[SUCCESS]`

# API Authentication
Currently Evolve-X has special authentication, this being token (`*`) and password (`**`) authentication types.

Token auth (`*`)
- Your headers will need to include `uid`, and `token`

Example:
```js
const superagent = require('superagent');
/* Superagent request */.set({ uid: 'Your user ID', token: 'Your special token' });
```

Password auth (`**`)
- Your headers will need to include `username`, and `password`

Example:
```js
const superagent = require('superagent');
/* Superagent request */.set({ username: 'Your useranme', password: 'Your password' });
```

Also, paths marked with an `$` will require you to be an admin.
Paths marked with `su` require you to be an owner.

# Actual paths, API

`POST /api/signup`

Signup for evolve-x

- * Requires a body with your desired username and password


* Username cannot be taken, and can be no more than 12 characters and no less than 3
- * Username may only contain lowercase letters, numbers, and an underscore.
* Passwords cannot be more than 32 characters, less than 8.
- * Passwords may only contain letters, numbers, the underscore, the `&` symbol, and a period.

### Notice

If the user has chosen to disable signups, your will get a status code 423 (locked) and the message `[WARN] Signups are closed.`

Example:
```js
const superagent = require('superagent');
superagent.post('your_url_here/api/signup').send({ username: 'hell_raiser420', password: 'omgItsNull9000' });
// Expected: "[SUCCESS] The admins have been notified of your account request!"
```

`GET /api/notifs`

flags: `*`

Returns your notifications.

### Notes

- If you append `?admin=true` to the end of the url, you will get admin notifications if you are an admin. If you are not an admin and try that, you will get an unauthorized status code.

Example:
```js
const superagent = require('superagent');
superagent.get('your_url_here/api/notifications');
```

*`DELETE /api/notifs`

Clear your notifications

Example:
```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/notifications');
```

`POST /api/verify`

flags: `*`, `$`

Verify a user.

- Body needs the validation token and user ID

### Notice

- This will return a 404 (not found) if it cannot find the user to verify!

- Deletes admin notification automatically

Example:
```js
const superagent = require('superagent');
superagent.post('your_url_here/api/verify').send({ uid: '545996854785731475959', token: 'bmpp2e2550-zFyBNHlL0LqSJRHAJw8v4dVk358wHgVAjI+FarmSR_Ga9pxioYl7l.VWV5bE5oR2ttajYzcExWUTFBTnc4UUZiOXlwQVk1R01EZHQ5bUpXWDU0aFUySlhzRmJodDY3UkplMlV3UUpuLQ==.NDQ2' });
// Expected: "[SUCCESS] Verified user!"
```

`DELETE /api/verify`

flags: `*`, `$`

Deny a user.

- Body needs the validation token and user ID

### Notice

- This will return a 404 (not found) if it cannot find the user to verify!

- Deletes admin notification automatically

Example:
```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/verify').send({ uid: '545996854785731475959', token: 'bmpp2e2550-zFyBNHlL0LqSJRHAJw8v4dVk358wHgVAjI+FarmSR_Ga9pxioYl7l.VWV5bE5oR2ttajYzcExWUTFBTnc4UUZiOXlwQVk1R01EZHQ5bUpXWDU0aFUySlhzRmJodDY3UkplMlV3UUpuLQ==.NDQ2' });
// Expected: "[SUCCESS] Denied user!"
```

`DELETE /api/account`

flags: `**`

Delete your account.
This is irreversible.

### Notice

This will not work if you are the owner.

- Admins can delete other accounts, just not other admin accounts or the owners account.
- Owners can delete admin accounts

Example:
```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/account');
// Expected: "[SUCCESS] Account deleted!"
```

`GET api/account`

flags: `**`

Get some account details

`GET api/admin_notification`

flags: `*`, `$`

Get some admin notification by ID

```js
const superagent = require('superagent');
superagent.get('your_url_here/api/admin_notification?id=[ID here]');
```

`DELETE api/admin_notification`

flags: `*`, `$`

Delete some admin notification by ID

### Notice

- Signup notifications are protected from manual deletion.

```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/admin_notification?id=[ID here]');
// Expected: "[SUCCESS] Notification deleted!"
```

`GET api/notification`

flags: `*`

Get some notification by ID

```js
const superagent = require('superagent');
superagent.get('your_url_here/api/notification?id=[ID here]');
```

`DELETE api/notification`

flags: `*`

Delete some notification by ID

```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/notification?id=[ID here]');
// Expected: "[SUCCESS] Notification deleted!"
```

`PATCH api/account`

flags: `**`

Update your account.

Keys: 
- `0` - `username`
- `1` - `password` 

It will not let you update your new key to your old one

### Notice
The new key is in the body as `new_key`

Example url: `localhost:7200/api/account?key=0`

```js
const superagent = require('superagent');
superagent.patch('your_url_here/api/account?key=[key]').send({ new_key: 'Your new key' });
```

`POST /api/token`

flags: `**`

Generate your api token.

### Notice

If you already have a token, you will need to add a force flags query to the end of the url, otherwise you may not regen a new token.

Example: `localhost:7200/api/token?flags=force`

```js
const superagent = require('superagent');
superagent.post('your_url_here/api/token');
```

`POST api/admin`

flags: `su`

Make an account into admin

### Notice

This can only be done on existing accounts

You have to use a query with id to make the account admin (ID must be an evolve-x ID)

Example: `?id=1337694201337694201337`

```js
const superagent = require('superagent');
superagent.post('your_url_here/api/admin?id=[new admin id here]');
```

`DELETE api/admin`

flags: `su`

Remove an account from admin powers

### Notice

This can only be done on existing accounts

You have to use a query with id to make the account admin (ID must be an evolve-x ID)

Example: `?id=1337694201337694201337`

```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/admin?id=[new admin id here]');
```

`POST api/short`

flags: `*`

Shorten a link!

Link will be in body under field `url`

```js
const superagent = require('superagent');
superagent.post('your_url_here/api/short').send({ url: 'http://expressjs.com/en/4x/api.html#req' });
```

`DELETE api/short`

flags: `*`

Remove a short!

Use ID with query under field `id`

```js
const superagent = require('superagent');
superagent.delete('your_url_here/api/short?id=gqgj96m4zb');
```

`GET api/shorts`

flags: `*`

Get all shorts associated with your account!

```js
const superagent = require('superagent');
superagent.get('your_url_here/api/shorts');
```

# Actual paths, frontend
(we will not be using superagent)

`/`

The home page.


`/short/:id`

Access a shortened link.
The ID will tell the app what link you get redirected to.
