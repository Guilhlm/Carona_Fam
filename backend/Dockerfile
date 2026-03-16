FROM node:20-alpine3.17 AS base

WORKDIR /app

RUN apk add --no-cache openssl1.1-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npm cache clean --force
RUN npx prisma generate

COPY src ./src/

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/server.js"]
