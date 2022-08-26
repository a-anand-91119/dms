FROM node:16

EXPOSE 50051

WORKDIR /usr/src/app
COPY package*.json ./
# RUN npm install
RUN npm ci --only=production

COPY ../protos .
COPY . .


CMD [ "node", "server.js" ]