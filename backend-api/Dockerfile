FROM node:16

EXPOSE 50052

WORKDIR /usr/src/app
COPY ./backend-api/package*.json ./
# RUN npm install
RUN npm ci --only=production

COPY ./protos /usr/src/protos
COPY ./backend-api/ .

CMD [ "node", "api.js" ]