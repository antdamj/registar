FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm install
RUN npx prisma generate

COPY src/ ./src/

CMD ["npx", "nodemon", "src/index.js"]
