FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npm cache clean --force
RUN npx prisma generate

COPY src ./src/

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/server.js"]
