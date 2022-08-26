FROM node:16

EXPOSE 50052

WORKDIR /usr/src/app
COPY package*.json ./
# RUN npm install
RUN npm ci --only=production

COPY . .

CMD [ "node", "api.js" ]