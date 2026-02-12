# Doctor CRM 部署指南

本文檔說明如何在不同環境中部署 Doctor CRM 系統。

## 目錄

1. [環境需求](#環境需求)
2. [開發環境部署](#開發環境部署)
3. [Docker 部署](#docker-部署)
4. [生產環境部署](#生產環境部署)
5. [數據庫遷移](#數據庫遷移)
6. [監控與維護](#監控與維護)

---

## 環境需求

### 最低配置
- **CPU**：2 核心
- **記憶體**：4GB RAM
- **硬碟**：20GB 可用空間
- **作業系統**：Linux (Ubuntu 22.04+) / macOS / Windows

### 軟體需求
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- Docker 24.x 或更高版本（容器化部署）
- Git

---

## 開發環境部署

### 1. 克隆專案

```bash
git clone <repository-url>
cd doctor-crm
```

### 2. 後端設置

```bash
cd backend

# 安裝依賴
npm install

# 複製環境配置
cp ../.env.development .env

# 創建測試數據（可選）
npm run seed

# 啟動開發服務器
npm run start:dev
```

### 3. 前端設置

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

### 4. 驗證部署

- 後端 API：http://localhost:3000/api
- API 文檔：http://localhost:3000/api/docs
- 前端界面：http://localhost:5173
- 健康檢查：http://localhost:3000/api/health

---

## Docker 部署

### 1. 使用 docker-compose

```bash
# 構建並啟動所有服務
docker-compose up --build

# 後台運行
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. 服務端口

| 服務 | 端口 | 說明 |
|------|------|------|
| backend | 3000 | NestJS API 服務 |
| frontend | 8080 | Nginx 靜態服務 |

### 3. 停止服務

```bash
# 停止服務
docker-compose down

# 停止並刪除數據卷
docker-compose down -v
```

---

## 生產環境部署

### 1. 環境準備

```bash
# 創建應用目錄
sudo mkdir -p /opt/doctor-crm
sudo chown $USER:$USER /opt/doctor-crm
cd /opt/doctor-crm

# 克隆專案
git clone <repository-url> .

# 創建數據目錄
mkdir -p data
```

### 2. 環境配置

```bash
# 複製並編輯生產環境配置
cp .env.production .env

# 編輯配置（必須修改以下項目）
nano .env
```

**必須修改的配置：**

```bash
# 生成安全的 JWT 密鑰
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# 設置正確的 CORS 來源
CORS_ORIGIN=https://your-domain.com
```

### 3. 使用 Docker 部署

```bash
# 構建生產映像
docker-compose -f docker-compose.yml build

# 啟動服務
docker-compose -f docker-compose.yml up -d

# 檢查服務狀態
docker-compose ps
```

### 4. Nginx 反向代理配置

```nginx
# /etc/nginx/sites-available/doctor-crm
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 後端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. 系統服務配置（可選）

```bash
# /etc/systemd/system/doctor-crm.service
[Unit]
Description=Doctor CRM
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/doctor-crm
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down

[Install]
WantedBy=multi-user.target
```

```bash
# 啟用服務
sudo systemctl enable doctor-crm
sudo systemctl start doctor-crm
```

---

## 數據庫遷移

### SQLite 到 MySQL/PostgreSQL

1. **導出 SQLite 數據**

```bash
# 使用 TypeORM 導出
cd backend
npm run typeorm -- schema:sync -d src/config/database.config.ts
```

2. **配置新數據庫**

編輯 `.env` 文件：

```bash
DATABASE_TYPE=mysql
DATABASE_HOST=your-mysql-host
DATABASE_PORT=3306
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=doctor_crm
```

3. **運行遷移**

```bash
# 生成遷移腳本
npm run typeorm -- migration:generate -d src/config/database.config.ts -n InitialMigration

# 運行遷移
npm run typeorm -- migration:run -d src/config/database.config.ts
```

---

## 監控與維護

### 健康檢查

```bash
# API 健康檢查
curl http://localhost:3000/api/health

# Docker 容器狀態
docker-compose ps
docker stats
```

### 日誌管理

```bash
# 查看後端日誌
docker-compose logs -f backend --tail=100

# 查看前端日誌
docker-compose logs -f frontend --tail=100

# 導出日誌
docker-compose logs backend > backend.log
```

### 備份策略

```bash
# 備份 SQLite 數據庫
cp data/database.sqlite data/backup/database_$(date +%Y%m%d).sqlite

# 備份 Docker 數據卷
docker run --rm -v doctor-crm_data:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/data_$(date +%Y%m%d).tar.gz /data
```

### 更新部署

```bash
# 拉取最新代碼
git pull origin main

# 重建並重啟服務
docker-compose down
docker-compose up --build -d

# 驗證服務狀態
docker-compose ps
curl http://localhost:3000/api/health
```

---

## 故障排除

### 常見問題

1. **端口被佔用**
   ```bash
   # 檢查端口使用
   lsof -i :3000
   lsof -i :8080
   ```

2. **數據庫連接失敗**
   ```bash
   # 檢查數據庫文件權限
   ls -la data/
   chmod 644 data/database.sqlite
   ```

3. **Docker 容器啟動失敗**
   ```bash
   # 查看詳細錯誤日誌
   docker-compose logs --tail=50 backend

   # 重建容器
   docker-compose build --no-cache backend
   ```

### 聯繫支援

如遇到無法解決的問題，請聯繫技術團隊並提供：
- 錯誤日誌
- 環境配置（隱藏敏感信息）
- 重現步驟

---

**最後更新**：2026年2月10日
