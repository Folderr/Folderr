FROM node:16 AS build
ARG installtype="--omit dev"

WORKDIR /usr/build

COPY package.json ./
RUN npm i -D
RUN npm i -g typescript
COPY . .

ARG buildcmd=build:production

RUN npm run ${buildcmd}

FROM node:16 AS setup

WORKDIR /usr/fldrr

COPY package.json ./

ENV NODE_ENV=${NODE_ENV:-production}
ENV DOCKER=true

RUN apt install python make gcc g++

COPY --from=build /usr/build/node_modules ./node_modules

ENV DEBUG=${DEBUG:+true}

COPY --from=build /usr/build/dist ./dist
COPY --from=build /usr/build/internal ./internal
COPY --from=build /usr/build/configs ./configs
COPY --from=build /usr/build/*config.* .

CMD ["npm", "run", "setup"]
EXPOSE 8888

FROM setup AS dev
COPY --from=build /usr/build/src ./src
RUN npm i -g ts-node-dev typescript
CMD ["npm", "run", "dev"]
EXPOSE 8888

FROM setup


CMD ["npm", "start"]
EXPOSE 8888