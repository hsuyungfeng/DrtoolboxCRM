# 前端 Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./
# 安裝依賴
RUN npm ci

# 複製源代碼
COPY . .
# 構建項目
RUN npm run build

# 運行階段：使用 Nginx 提供靜態文件
FROM nginx:alpine AS runner

# 複製構建結果到 Nginx 目錄
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# Nginx 自動啟動