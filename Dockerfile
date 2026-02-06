FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p files
EXPOSE 3090
CMD ["node", "server.js"]
