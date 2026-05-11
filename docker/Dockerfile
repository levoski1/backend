FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

COPY dist/ .

EXPOSE 4000

USER node

CMD ["node", "index.js"]
