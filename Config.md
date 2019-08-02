# Evolve-X config

### Keys

Port - The port to listen to on your machine

- If you are on linux, I recommend do not go below port 1024 or run this as root

mongoUrl - The url you are going to connect to mongodb with.

url - The url this app is going to have. This is only so Evolve-X can reference its own url, for like uploading images.

apiOnly - If you only want the api and no frontend, set this to true

Signups - Whether or not to allow people to signup to your app.

### Example config

```json
{
    "url": "localhost",
    "port": 1337,
    "mongoUrl": "mongodb://localhost/e-x",
    "apiOnly": true,
    "signups": false
}
```

### Default config

```json
{
    "url": "localhost",
    "port": 8888,
    "mongoUrl": "mongodb://localhost/evolve-x",
    "apiOnly": false,
    "signups": true
}
```
