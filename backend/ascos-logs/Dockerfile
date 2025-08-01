FROM node:22.11.0 as build

WORKDIR /usr/src/app

COPY --chown=node:node ["package.json", "package-lock.json", "./"]
COPY --chown=node:node ["tsconfig.json", "tsconfig.build.json", "tsconfig.base.json", "./"]

COPY --chown=node:node commons-be commons-be
COPY --chown=node:node constants constants
COPY --chown=node:node constantsjs constantsjs
COPY --chown=node:node backend/ascos-logs backend/ascos-logs

RUN npm install --no-save semver
RUN npm install -g --no-save rimraf husky
RUN npm run install:all --legacy-peer-deps

RUN cd constantsjs && npm run compile && cd ..
RUN cd commons-be && npm run compile && cd ..

RUN npm run build

FROM node:22.11.0

RUN apt-get update \
    && apt-get -y install netcat-openbsd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY backend/ascos-logs/docker.d/probe.sh .
RUN chmod +x probe.sh

COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/constants ./constants
COPY --from=build --chown=node:node /usr/src/app/constantsjs ./constantsjs
COPY --from=build --chown=node:node /usr/src/app/commons-be ./commons-be
COPY --from=build --chown=node:node /usr/src/app/backend/ascos-logs/node_modules ./backend/ascos-logs/node_modules
COPY --from=build --chown=node:node /usr/src/app/backend/ascos-logs/dist ./backend/ascos-logs/dist

USER node

CMD [ "node", "backend/ascos-logs/dist/main.js" ]
