# Folderr - A FOSS file host

This is an experimental version of Folderr V2

This is not final product, use at your own risk.

## Getting started

Table of contents, with 2 options:

- [1. Normal Setup](#normal)
- - [1a. Prerequisites](#prerequisites)
- - [1b. Usage/setup](#setup)
- [2. Docker](#docker)
- - [2a. Docker Prerequisites & Usage](#docker-prerequisites-and-usage)

### Normal

This is a real quick getting started for the development versions of folderr.

#### Prerequisites:

- [NodeJS](https://nodejs.org/en/) 14 or 16 (LTS versions)
- [Python](https://www.python.org/downloads/) 3.6-3.9. Run `python --version` or `python3 --version` in the commandline/terminal/powershell to see if installed
- [node-gyp](https://www.npmjs.com/package/node-gyp)
- [Git](https://git-scm.com/downloads) command line. Typically pre-installed on Linux. To check if git is installed run `git --version` in the commandline/terminal/powershell
- [MongoDB](https://www.mongodb.com/) server/database
- [typescript](https://www.typescriptlang.org/download) (npm module)

#### Setup

1. Clone the repo. Instructions [here](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository-from-github/cloning-a-repository#cloning-a-repository)
2. Follow the below (In a powershell/terminal/ssh session)

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

### Docker

This is a real simple docker tutorial to build it yourself.
This assumes you already have Folderr setup.

#### Docker Prerequisites & Usage

Prerequisites:

- [docker](https://www.docker.com/)

Usage:

- Clone the repository (instructions below)

```sh
git clone https://github.com/Folderr/Folderr

# Please configure Folderr before this next part

# building the image. This will take a while.
docker build -t Folderr
# Once done, you may run the container. It expects port 8888.
docker run -dp 8888:8888 -v Files:/usr/fldrr/Files -v "$(pwd)/configs:/usr/fldrr/configs" Folderr --name Folderr
```

# License

Folderr is licensed under AGPL Version 3.

# Copyright

Copyright (C) 2020 Folderr
