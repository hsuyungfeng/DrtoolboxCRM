# 後端 Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./
# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .
# 構建項目
RUN npm run build

# 運行階段
FROM node:18-alpine AS runner

WORKDIR /app

# 安裝依賴（僅生產環境）
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# 創建數據庫目錄（SQLite）
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 運行命令
CMD ["npm", "run", "start:prod"]