FROM node:16 AS build

WORKDIR /usr/build

COPY package.json ./
RUN npm i
COPY . .

ARG buildcmd=build:production

RUN npm run ${buildcmd}

FROM node:16 AS setup

ARG installtype="--omit dev"

WORKDIR /usr/fldrr

COPY package.json ./

ENV NODE_ENV=${NODE_ENV:-production}
ENV DOCKER=true

RUN apt install python make gcc g++

RUN npm install ${installtype}

ENV DEBUG=${DEBUG:+true}

COPY --from=build /usr/build/dist ./dist
COPY --from=build /usr/build/internal ./internal
COPY --from=build /usr/build/configs ./configs

FROM setup AS dev
CMD ["npm", "run", "dev"]

FROM setup

CMD ["npm", "start"]
EXPOSE 8888