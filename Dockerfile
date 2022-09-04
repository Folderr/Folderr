FROM node:16 AS build

WORKDIR /usr/build

COPY package.json ./
RUN npm i -D
COPY . .

RUN npm run build:production

FROM node:16

WORKDIR /usr/fldrr

COPY package.json ./

ENV NODE_ENV=production
ENV DOCKER=true

RUN apt install python make gcc g++

RUN npm install --omit=dev

ENV DEBUG=true

COPY --from=build /usr/build/dist ./dist
COPY --from=build /usr/build/internal ./internal
COPY --from=build /usr/build/configs ./configs

CMD ["npm", "start"]
EXPOSE 8888