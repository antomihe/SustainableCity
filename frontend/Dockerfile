# 1: Build stage
FROM node:22-alpine AS builder

LABEL maintainer="Antonio Miguel Herrero <contacto@antomihe.es>"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2: Production stage
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=demo
EXPOSE 3000

CMD ["npm", "start"]
