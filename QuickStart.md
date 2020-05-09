# To begin

### Lets install Folderr-X

Make sure you have access to MongoDB and NodeJS version 8 or higher before installing Folderr-X (NGINX will be useful on Linux).

To install: `git clone https://gitlab.com/evolve-x/evolve-x`

### We will need all main dependencies, and TypeScript.

If you don't have TypeScript do

`npm i -g typescript`

Next, install dependencies in the folder you cloned Folderr-X in.

`npm i` or `yarn install`

Finally, run the first command

`<npm|yarn> run first`

After completing the first user creation, you will need to configure Folderr-X, head to https://gitlab.com/evolve-x/evolve-x/blob/master/Config.md (If you want to, you can ue the defaults).

After configuring Folderr-X (or not, whatever tips your boat) you can finally run

`<npm|yarn> start`

*or*

`<npm|yarn> run startpm2` if you have pm2, and that is what you want to do.

Updating is rather simple.

`<npm|yarn> run update`

# Ok so, what If I don't want to use your commands, Null?

Well, that is easy, ish.

To start Folderr-X you want to have the CWD (Current working directory) be where you installed it.

Node arguments: `- esm` This is needed otherwise it dies.

`node start ...args path/to/src/index.js` -> Nodejs command

Updating

`git pull`,

`<npm|yarn> install` (Only needed if there are new packages)

`tsc` (Not needed if it is a frontend update)
