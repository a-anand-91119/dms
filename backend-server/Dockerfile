FROM node:16

EXPOSE 50051

WORKDIR /usr/src/app
COPY ./backend-server/package*.json ./
# RUN npm install
RUN npm ci --only=production

COPY ./protos /usr/src/protos
COPY ./backend-server/ .


CMD [ "node", "server.js" ]