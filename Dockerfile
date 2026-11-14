# 云端部署用（Google Cloud Run / AWS App Runner / Lightsail 都能用）
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build
RUN cd backend && npm ci --omit=dev
ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/server.js"]
