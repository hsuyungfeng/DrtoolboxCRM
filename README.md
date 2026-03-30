# Doctor CRM 醫療療程管理系統

專為醫療機構設計的客戶關係管理系統，核心功能圍繞「療程執行、分潤計算、員工管理」三大模塊。

## 功能特色

### 核心功能
- **患者管理**：完整的患者檔案管理，包含醫療資訊、過敏史、緊急聯絡人
- **療程管理**：療程規劃與追蹤，支援多次療程記錄
- **員工管理**：醫師、治療師、助理等角色管理
- **分潤計算**：自動化分潤引擎，支援百分比、固定金額、階梯式三種規則
- **財務鎖定**：防止已確認的財務記錄被竄改
- **多診所隔離**：支援多診所數據隔離架構

### Doctor Toolbox 整合（Phase 4 ✅）
- **雙向患者同步**：與 Doctor Toolbox 系統實時同步患者資料
- **智能患者匹配**：精確查詢（身份證+姓名）及備用查詢（姓名+電話）
- **自動衝突解決**：CRM 作為權威來源，自動解決數據衝突
- **批量遷移**：初始連線時可批量匯入 1000+ 患者（約 16 分鐘）
- **進度追蹤**：完整的遷移進度追蹤，支援 ETA 計算及恢復功能
- **稽核日誌**：所有同步事件的不可變追蹤記錄
- **失敗監控**：自動檢測同步失敗模式（≥3 次/24h 時發出警告）
- **完整 REST API**：8 個端點用於查詢稽核日誌、監控統計

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
├── backend/                      # NestJS 後端
│   ├── src/
│   │   ├── auth/                # 認證模塊
│   │   ├── patients/            # 患者管理
│   │   ├── treatments/          # 療程管理
│   │   ├── staff/               # 員工管理
│   │   ├── revenue/             # 分潤管理
│   │   ├── common/              # 共用模塊
│   │   ├── events/              # 事件系統
│   │   └── doctor-toolbox-sync/ # Doctor Toolbox 整合（Phase 4）
│   │       ├── controllers/     # Webhook + 稽核 REST API
│   │       ├── services/        # 同步引擎 + 監控
│   │       ├── entities/        # 索引 + 進度追蹤
│   │       ├── guards/          # Webhook 簽名驗證
│   │       └── dto/             # 數據驗證 Schema
│   ├── docs/api/                # API 文檔
│   └── test/                    # 測試文件
├── frontend/                     # Vue 3 前端
│   ├── src/
│   │   ├── components/          # 組件
│   │   ├── views/               # 頁面
│   │   ├── services/            # API 服務
│   │   ├── stores/              # 狀態管理
│   │   └── locales/             # 國際化
│   └── public/                  # 靜態資源
├── .planning/phases/            # 規劃文檔
├── .github/workflows/           # CI/CD 配置
├── docker-compose.yml           # Docker 編排
└── .env.example                # 環境變量範例
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

### Doctor Toolbox 整合端點（Phase 4 ✅）

**Webhook 輸入：**
| 端點 | 說明 |
|------|------|
| `POST /sync/webhook` | 接收 Doctor Toolbox 患者事件（HMAC-SHA256 驗證） |

**診所遷移：**
| 端點 | 說明 |
|------|------|
| `POST /migrate/:clinicId` | 開始批量匯入患者 |
| `POST /migrate/:clinicId/resume` | 恢復中斷的遷移 |
| `GET /migrate/:clinicId/progress` | 查詢遷移進度 (含 ETA) |
| `DELETE /migrate/:clinicId` | 中止遷移 |

**稽核與監控：**
| 端點 | 說明 | 認證 |
|------|------|------|
| `GET /sync/audit/logs/:patientId` | 患者同步日誌 | JWT |
| `GET /sync/audit/clinic` | 診所同步事件 (支援日期篩選) | JWT |
| `GET /sync/audit/stats` | 同步統計與失敗警告 | JWT |
| `GET /sync/audit/retry-patterns` | 重試分析 | JWT |

詳見 [Doctor Toolbox API 文檔](docs/api/integration-api.md)（繁體中文）

## 專案階段

本專案分為多個開發階段，逐步完善系統功能：

| 階段 | 狀態 | 主要交付 | 完成日期 |
|------|------|--------|--------|
| **Phase 1** | ✅ 完成 | 療程處方核心系統（470+ 測試） | 2026-03-27 |
| **Phase 2** | ✅ 完成 | 患者通知系統（事件驅動、排程） | 2026-03-27 |
| **Phase 3** | ✅ 完成 | 財務管理系統（分潤、發票、報表） | 2026-03-28 |
| **Phase 4** | ✅ 完成 | Doctor Toolbox 整合（雙向同步、稽核） | 2026-03-31 |
| **Phase 5** | ⏳ 規劃中 | 增強功能（出站同步、排程協調） | TBD |

詳見 [.planning/phases/](./planning/phases/) 了解各階段的規劃文檔

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

### Doctor Toolbox 整合配置（Phase 4）

| 變量 | 說明 | 必須 |
|------|------|------|
| `DOCTOR_TOOLBOX_WEBHOOK_SECRET` | Webhook 簽名密鑰（從 Toolbox 管理員取得） | ✅ |
| `DOCTOR_TOOLBOX_API_URL` | Doctor Toolbox API 端點 | ✅ |
| `WEBHOOK_TIMESTAMP_WINDOW` | Webhook 時間戳有效期（秒）| 300 |

詳見 [Doctor Toolbox 整合指南](docs/INTEGRATION_GUIDE.md)

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案為私有專案，未經授權不得使用。

## 測試狀態

- ✅ **後端構建**：`npm run build` → SUCCESS (零編譯錯誤)
- ✅ **單元測試**：18+ 個測試 (Doctor Toolbox 整合)
- ✅ **E2E 測試**：完整工作流驗證
- ✅ **測試覆蓋率**：>90% (核心功能)

## 支援與文檔

- 📖 [Doctor Toolbox 整合指南](docs/INTEGRATION_GUIDE.md) - 4 步部署指南 (繁體中文)
- 🔌 [API 整合文檔](docs/api/integration-api.md) - Webhook 契約與範例 (繁體中文)
- 📋 [Phase 4 最終報告](.planning/phases/04-doctor-toolbox-integration/PHASE-04-FINAL-STATUS.md)

## 聯絡與回饋

如有任何問題或建議，請提出 Issue 或聯絡開發團隊。

---

**版本**：0.1.0 (Phase 4 完成)
**最後更新**：2026年3月31日 (Doctor Toolbox 整合完成)
**構建狀態**：✅ PASSING
**Production Ready**：✅ 是
