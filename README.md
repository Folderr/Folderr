# Folderr - A FOSS file host

This is an experimental version of Folderr V2

This is not final product, use at your own risk.

## Getting started

This is a real quick getting started for the development versions of folderr.

Prerequisites:

- [NodeJS](https://nodejs.org/en/) 14 or 16 (LTS versions)
- [Python](https://www.python.org/downloads/) 3.6-3.9. Run `python --version` or `python3 --version` in the commandline/terminal/powershell to see if installed
- [node-gyp](https://www.npmjs.com/package/node-gyp)
- [Git](https://git-scm.com/downloads) command line. Typically pre-installed on Linux. To check if git is installed run `git --version` in the commandline/terminal/powershell
- [MongoDB](https://www.mongodb.com/) server/database
- [typescript](https://www.typescriptlang.org/download) (npm module)

1. Clone the repo
2. Follow the below

```sh
cd <your-cloned-folderr-instance>
npm install
# If you are going to develop with folderr you can run "npm install -D" instead
npm run build
npm run configure
npm run setup
```

You can run `npm run start` now to start Folderr or you can use pm2 with `pm2 start --env production --name Folderr dist/src/index.js`

For debug mode run `DEBUG=true npm run start` or `pm2 start --env {"NODE_ENV": "production", "DEBUG": true} --name Folderr dist/src/index.js`

For development you should run `npm run start:dev` or `pm2 start --env {"NODE_ENV": "development", "DEBUG": true} --name Folderr dist/src/index.js`

# License

Folderr is licensed under AGPL Version 3.

# Copyright

Copyright (C) 2020 Folderr
