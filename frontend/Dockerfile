FROM node:22.11.0 as build

WORKDIR /build

COPY . .

RUN npm install -g --no-save rimraf husky
RUN npm install --legacy-peer-deps --workspaces --if-present

RUN cd constantsjs && npm run compile && cd ..

ENV NODE_OPTIONS "--max_old_space_size=4096"
ENV VITE_ENV_DIR ./docker.d/

RUN npm run build -w frontend

FROM nginx:1.23.3

COPY frontend/docker.d/default.conf /etc/nginx/conf.d/
COPY frontend/docker.d/*.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

RUN mkdir /usr/share/nginx/html-template/
COPY --from=build /build/frontend/dist/ /usr/share/nginx/html-template/
