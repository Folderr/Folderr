# API Documentation

<hr>

Hi lets talk about authentication for the API

### Authentication way number 1:

- The most common one

Header token: Your API token

Header uid: Your unique user ID

### Authentication way number 2:

- This involves data that can be used to login directly to your account

Header username: This is your evolve-x username in a header.

Header password: This is your evolve-x account password

# Paths

### GET /api

No authorization required

Returns "Pong!"

## Links and images

### POST /api/upload

Upload a image to Evolve-X

Upload limit: 50mb

Returns success unless over size limit, no image, or mime type is incorrect

Authentication: 1.


| Input | Type                | Required |  Description |
|-------|---------------------|----------|---|
| files | multipart/form-data | true     |  The file to upload, the API can only do 1 at a time. |

### POST /api/short

Shorten a link with Evolve-X

Returns success unless data is missing or invalid link is sent.

Authentication: 1

| Input | Type                | Required | Description  |
|-------|---------------------|----------|---|
| link | string | true     |The link to shorten. Sent in body.   |

### GET /api/uploads

Fetch all images shown in Evolve-X as an array.

Authentication: 1

### GET /api/shorts

Fetch all shortened links you have uploaded

Returns array of strings

Authentication: 1


### DELETE /api/short?id=${short.id}

Delete a shortened link.

Authentication: 1

Returns success or errors if no query or no short could be found.

### DELETE /api/upload?id=${image.id}

Delete a image.

Authentication: 1

Returns success or errors if no query or no image could be found with that ID.

## Account

### POST /api/signup

Signup to Evolve-X

Body:

| Input    | Type   | Required | Description                    |
|----------|--------|----------|--------------------------------|
| username | string | true     | Your username on Evolve-X      |
| password | string | true     | Your password for you account. |

### GET /api/account

Get your evolve-x account and some statistics related to it

Authentication: 2

Returns (JSON):

| Value          | Type    | Description                            |
|-----------------|---------|----------------------------------------|
| username        | string  | Your accounts username                 |
| token_generated | boolean | Whether or not your token is generated |
| uID             | string  | Your User ID                           |
| admin           | boolean | Whether or not you are a admin.        |
| owner           | boolean | If you are the instance owner or not.  |
| images          | number  | How many images you have uploaded      |
| shorts          | number  | How many links you have shortened      |

### DELETE /api/account

Delete your Evolve-X account and any data related to it.

Authentication: 2

Returns success if account has been deleted.

###### Admins specifically can delete your account

Query: `?uid=${user.id}`

### PATCH /api/account

Update your Evolve-X account name or password

Authentication: 2

URL Query:

| Input | Parameter | Required | Description                                       |
|-------|------|----------|---------------------------------------------------|
| key   | 0 or 1  | true     |What to update.<br>0 => Username1 => Password 

Body: 

| Input   | Type   | Required | Description                 |
|---------|--------|----------|-----------------------------|
| new_key | string | true     | The new data you are going to give this key (username or password) |

Returns success, or error if you entered in an invalid/used new_key or an invalid key in the query.
Also errors if it fails to said new key.

### POST /api/token

Generate a token.

If you already have a token you will need to tell it to force regenerate your token.

Regen query: `?flags=force`

Authentication 2

Returns a string (your token) or throws an error if you have a token and didn't force it to regenerate the token.

## Notifications

### GET /api/notifications

Optional admin query: `?admin=true`

- => Fetches administrator notifications.

Authentication: 1

Returns: Error, not found, or (array):

| Value | Type   | Description                  |
|--------|--------|------------------------------|
| title  | string | Notification title          |
| notify | string | The notification information |
| ID     | string | Notification ID              |

### GET /api/notification?id=${notification.id}

Fetches the notification

Authentication: 1

Returns: Error, not found or:

| Value | Type   | Description                  |
|--------|--------|------------------------------|
| title  | string | Notification title          |
| notify | string | The notification information |
| ID     | string | Notification ID              |

### GET /api/admin_notification?id=${notification.id}

Fetch an admin notification.

- Used mainly for verifying users.

Authentication: 1

- Admin status required or it will return unauthorized

Returns: Error, not found, or: 

| Value | Type   | Description                  |
|--------|--------|------------------------------|
| title  | string | Notification title          |
| notify | string | The notification information |
| ID     | string | Notification ID              |

### GET /api/notification?id=${notification.id}

Delete a notification

Authentication: 1

Returns: Error, not found or success.

### DELETE /api/admin_notification?id=${notification.id}

Delete an admin notification.

Authentication: 1

- Admin status required or it will return unauthorized

Returns: Error, not found, or success.

### DELETE /api/notifications?id=${notification.id}

Delete all notifications

Authentication: 1

Returns: Error, or success.

## Admin

### POST /api/verify

Verify a users account

Authentication: 1

- Requires admin or greater

Body:

| input | Type   | Required | Description            |
|-------|--------|----------|------------------------|
| uid   | string | true     | Users user ID          |
| token | string | true     | Users validation token |

Returns: Success.

Errors if you screwed up, user doesn't exist, or if you are missing something.

- Removes associated admin notification on success

### DELETE /api/verify

Deny a users account

Authentication: 1

- Requires admin or greater

Body:

| input | Type   | Required | Description            |
|-------|--------|----------|------------------------|
| uid   | string | true     | Users user ID          |
| token | string | true     | Users validation token |

Returns: Success.

Errors if you screwed up, user doesn't exist, or if you are missing something.

- Removes associated admin notification on success

### GET /api/info

Shows Evolve-Xs version, git commit, and branch

Authentication: 1

Returns (success, json):

| Value   | Type   | Description               |
|---------|--------|---------------------------|
| commit  | string | Git commit Evolve-X is on |
| branch  | string | Evolve-X current branch   |
| version | string | The version running.      |

## Owner specific

- These require you to be the instance owner

### POST /api/admin?id=${user.id}

Promote a user to Admin status

Authentication: 2

Returns: Error (already admin, missing id...), success, or not found (user does not exist).

### DELETE /api/admin?id=${user.id}

Demote a admin to user status

Authentication: 2

Returns: Error (already admin, missing id...), success, or not found (user does not exist).

### POST /api/manage

Queries (`?t=${manageQuery}`):

| Query | Description                  |
|-------|------------------------------|
| s     | Shutdown Evolve-X            |
| u     | Update Evolve-X              |
| t     | Run the TypeScript compiler. |

Runs a command on Evolve-X

Authentication: 2

Returns Error, Success string.

###### Note

If shutting down Evolve-X and it runs on a process manager, it should usually restart the process.
