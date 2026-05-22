FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist
COPY README.md ./README.md
EXPOSE 8080
CMD ["node", "dist/index.js"]
