FROM node:20 AS build
ARG installtype="--omit dev"

WORKDIR /usr/build

RUN apt install python make gcc g++

COPY package.json ./
RUN npm i -D
RUN npm i -g typescript
COPY . .

ARG buildcmd=build:production

RUN npm run ${buildcmd}

FROM node:20 AS setup

WORKDIR /usr/fldrr

COPY package.json ./

ENV NODE_ENV=${NODE_ENV:-production}
ENV DOCKER=true

COPY --from=build /usr/build/node_modules ./node_modules

ENV DEBUG=${DEBUG:+true}

COPY --from=build /usr/build/dist ./dist
COPY --from=build /usr/build/internal ./internal
COPY --from=build /usr/build/configs ./configs
COPY --from=build /usr/build/*config.* .

FROM setup AS dev
COPY --from=build /usr/build/ .
RUN npm i -g ts-node-dev typescript

CMD ["npm", "run", "dev"]
EXPOSE 8888

FROM setup AS prod

CMD ["npm", "start"]
EXPOSE 8888