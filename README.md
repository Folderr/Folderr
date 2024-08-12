# Folderr - A FOSS file host

[![Unstable Build](https://github.com/Folderr/Folderr/actions/workflows/build.yml/badge.svg)](https://github.com/Folderr/Folderr/actions/workflows/build.yml)

This is an experimental version of Folderr V2

This is not final product, use at your own risk.

## Getting started

Table of contents, with 2 options:

- [1. Normal Setup](#normal)
- [2. Mock Docker](#docker)
- - [2a. Docker Prerequisites & Usage](#docker-prerequisites-and-usage)

### Normal

This is a real quick getting started for the development versions of folderr.

Quick start guide moved to:
- [Our documentation site](https://folderr.net/guides/folderr/getting-started) or
- [Our Github Docs Repo](https://github.com/Folderr/Docs/blob/master/Guides/Folderr/2.0.0/getting-started.md) or
- [Our Git Docs Repo](https://git.folderr.net/Folderr/Docs/src/branch/master/Guides/Folderr/2.0.0/getting-started.md)

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

Copyright (C) 2020-2023 Folderr
