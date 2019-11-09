# Evolve-X
An app meant to host images, videos, and possibly shorten links.

Looking for path documentation? Head to [the paths documentation here](./Paths.md)

or look through the html version [here](https://evolvex.docs.apiary.io/#)

Looking for the config perhaps? Check out [The config documentation](./Config.md)

# Requirements

- Node
- Typescript
- Git
- Yarn, for the update command.

# Cheat sheet

Getting started is as easy as running `npm run first`, after cloning the repo through git of course

Updating? `npm run update`

Get your config sorted out by [visiting the config documentation.](./Config.md)

Finally, Start the app `npm start`, or `npm run startpm2` if you want to use pm2 instead

# What each of those commands do

`npm run first`
- `tsc` Transpiles from Typescript to JavaScript
- `node -r esm scripts/initFirst` Initializes the owner account

`npm run update`
- `git pull` to fetch the latest update
- `tsc` to rebuild the app with this update

`npm start`
- `node -r esm src/index.js` Runs the main file to start the app, in a normal cli with esm (ES6 modules).

`npm run startpm2`
- `pm2 start --name evolve-x --node-args "-r esm" src/index.js` Runs the main file with ES6, but instead of using the CLI it uses pm2, so you can manage it better.

# Made & Maintained by

Developer: Null (VoidNulll)

Designer: Catbirby

Contributors.

# Licensing and code

[LICENSE](https://www.gnu.org/licenses/agpl-3.0.html)

I try to make it known where I get my code from.

Any code without an author stated somewhere within/around the function/line of code is assumed to be my own.

If you have any complaints on code stealing (and this is from the original [Evolve-X Repository](https://gitlab.com/evolve-x/evolve-x)), please

- Check the development branch version. That is usually up to date.
- If not found in the development branch create an issue on the gitlab with the tag "Copyright Issue" and the line of code. I will see if this code was taken from anywhere.

# Copyright

Copyright (C) 2019 VoidNulll
