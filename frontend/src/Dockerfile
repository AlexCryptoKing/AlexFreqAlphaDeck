FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

# Dev-style serve (compose mounts src as read-only)
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5000"]
