# Doctor CRM 醫療療程管理系統

專為醫療機構設計的客戶關係管理系統，核心功能圍繞「療程執行、分潤計算、員工管理」三大模塊。

## 功能特色

- **患者管理**：完整的患者檔案管理，包含醫療資訊、過敏史、緊急聯絡人
- **療程管理**：療程規劃與追蹤，支援多次療程記錄
- **員工管理**：醫師、治療師、助理等角色管理
- **分潤計算**：自動化分潤引擎，支援百分比、固定金額、階梯式三種規則
- **財務鎖定**：防止已確認的財務記錄被竄改
- **多診所隔離**：支援多診所數據隔離架構

## 技術棧

### 後端
- **框架**：NestJS 11.x
- **語言**：TypeScript 5.7.x
- **ORM**：TypeORM 0.3.x
- **數據庫**：SQLite（開發）/ MySQL / PostgreSQL（生產）
- **認證**：JWT + Passport

### 前端
- **框架**：Vue 3.5 + Composition API
- **語言**：TypeScript
- **UI 元件**：Naive UI
- **狀態管理**：Pinia
- **國際化**：vue-i18n（繁體中文為主）

### 部署
- **容器化**：Docker + docker-compose
- **CI/CD**：GitHub Actions

## 快速開始

### 環境需求
- Node.js 18+
- npm 9+

### 安裝步驟

```bash
# 複製專案
git clone <repository-url>
cd doctor-crm

# 後端設置
cd backend
npm install
cp ../.env.example .env
npm run start:dev

# 前端設置（新終端視窗）
cd frontend
npm install
npm run dev
```

### 訪問服務
- **後端 API**：http://localhost:3000/api
- **API 文檔**：http://localhost:3000/api/docs
- **前端界面**：http://localhost:5173

## 專案結構

```
doctor-crm/
├── backend/                 # NestJS 後端
│   ├── src/
│   │   ├── auth/           # 認證模塊
│   │   ├── patients/       # 患者管理
│   │   ├── treatments/     # 療程管理
│   │   ├── staff/          # 員工管理
│   │   ├── revenue/        # 分潤管理
│   │   ├── common/         # 共用模塊
│   │   └── events/         # 事件系統
│   └── test/               # 測試文件
├── frontend/               # Vue 3 前端
│   ├── src/
│   │   ├── components/     # 組件
│   │   ├── views/          # 頁面
│   │   ├── services/       # API 服務
│   │   ├── stores/         # 狀態管理
│   │   └── locales/        # 國際化
│   └── public/             # 靜態資源
├── .github/workflows/      # CI/CD 配置
├── docker-compose.yml      # Docker 編排
└── .env.example           # 環境變量範例
```

## API 文檔

啟動後端服務後，訪問 http://localhost:3000/api/docs 查看 Swagger API 文檔。

### 主要 API 端點

| 模塊 | 端點 | 說明 |
|------|------|------|
| 認證 | `POST /api/auth/login` | 使用者登入 |
| 患者 | `GET/POST /api/patients` | 患者管理 |
| 療程 | `GET/POST /api/treatments` | 療程管理 |
| 員工 | `GET/POST /api/staff` | 員工管理 |
| 分潤規則 | `GET/POST /api/revenue-rules` | 分潤規則管理 |
| 分潤記錄 | `GET /api/revenue-records` | 分潤記錄查詢 |

## 開發指南

### 運行測試

```bash
# 後端測試
cd backend
npm run test           # 單元測試
npm run test:e2e       # 端對端測試
npm run test:cov       # 覆蓋率報告

# 前端構建
cd frontend
npm run build          # 類型檢查 + 構建
```

### 代碼規範

```bash
# 後端 Lint
cd backend
npm run lint

# 格式化
npm run format
```

## Docker 部署

```bash
# 構建並啟動
docker-compose up --build

# 後台運行
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

## 環境變量

參見 [.env.example](.env.example) 了解所有可配置的環境變量。

### 重要配置

| 變量 | 說明 | 預設值 |
|------|------|--------|
| `NODE_ENV` | 運行環境 | development |
| `PORT` | 後端端口 | 3000 |
| `JWT_SECRET` | JWT 密鑰 | (必須修改) |
| `DATABASE_PATH` | SQLite 路徑 | ./database.sqlite |

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案為私有專案，未經授權不得使用。

---

**版本**：0.0.1
**最後更新**：2026年2月10日
