# Evolve-X config

### Keys

Port - The port to listen to on your machine

- If you are on linux, I recommend to not go below port 1024 and not to run this as root
- Bad things could happen but shouldn't, but its safe to go with recommended practices.

mongoUrl - The url you are going to connect to mongodb with.

url - The url this app is going to have. This is only so Evolve-X can reference its own url, for like uploading images.

apiOnly - If you only want the api and no frontend, set this to true

signups - Whether or not to allow people to signup to your app.

trustProxies - Whether or not to trust proxies (useful for if you are running behind a reverse proxy like nginx)

certOptions - Object containing options for https.

certOptions.cert - COMPLETE path to cert (Not relative).

certOptions.ca - Only useful to people who use self signed certs.

certOptions.key - Exact path to certificate key.

certOptions.requestCert - This is necessary only if using client certificate authentication.

discordURL - String of a valid discord webhook URL

enableDiscordLogging - Boolean of if discord logging should be enabled

discordHook - Object containing name &/or avatar to overwrite when sending the webhook

discordHook.avatar_url - Image URL to overwrite the webhooks avatar

discordHook.name - New name to overwrite when sending the webhook

- Discord related logging is not recommended, and may be deprecated in the future.

sharder - Sharder restrictions & settings.

- Evolve-X process sharder may be experimental

sharder.enabled - Whether or not to enable sharding (boolean)

sharder.maxCores - The maximum amount of cores available to use when sharding (number).

sharder.maxMemory - The maximum amount of memory to allow total process usage. Format: `value<format>`. Default: `4G` (G standing for gigabyte).
- Memory formats: mb/m (megabytes) or gb/g (gigabytes)

security - Options for security

security.disableInsecure - Disable the "I know my data is at risk" warning on certain endpoints (boolean)

### Discord webhooks
Learn about webhooks at https://support.discordapp.com/hc/en-us/articles/228383668-Intro-to-Webhooks

### Example config

```json
{
    "url": "localhost",
    "port": 1337,
    "mongoUrl": "mongodb://localhost/e-x",
    "apiOnly": true,
    "signups": false,
    "security": { "disableInsecure": true }
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
