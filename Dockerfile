FROM node:16-alpine AS builder
WORKDIR /app/public
COPY public/package*.json ./
RUN npm install
COPY public/ .
RUN npm run build

FROM node:16-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .
COPY --from=builder /app/public/build /app/public/build
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "index.js"]
