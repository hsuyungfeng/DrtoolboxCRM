# Doctor Toolbox CRM

Doctor Toolbox CRM 是一個專為醫療機構與醫美診所打造的客戶關係管理系統。本系統以**「療程執行與管理」**為核心，整合了複雜的醫療人員分潤（PPF, Pay-Per-Performance）機制，完整串接病患資料、療程跟進、排程管理與員工薪資計算。

目前本專案處於 **Phase 4 前端深度開發與優化階段**，已具備極高質量的後端 API 基礎。

## 🌟 核心特色 (Core Features)

1. **以療程為核心的資料模型**：不只是簡單的訂單系統，而是精確追蹤「療程次數」、「執行細節」、「執行人員」與「狀態更新」。
2. **強大的 PPF 分潤引擎**：支援比例（Percentage）、固定金額（Fixed）、階梯式（Tiered）等多種抽成模型，解決一對多、多對多的醫療服務分帳痛點。
3. **事件驅動架構 (Event-Driven)**：隨著療程完成自動計算分潤並鎖定財務資料，確保系統自動化與資料不被竄改。
4. **多診所租戶支援**：底層具備完善的 `clinicId` 隔離機制與攔截檢查，支援多機構/分店共用系統但資料絕對隔離。
5. **高度模組化的前端體驗**：運用 Vue 3 + Naive UI 建構流暢的管理介面，支持彈性的後台操作。

## 🚀 技術棧 (Tech Stack)

### 後端 (Backend)
- **Framework:** NestJS 11.x
- **Language:** TypeScript 5.7+
- **ORM:** TypeORM 0.3.x
- **Database:** SQLite (開發環境) / PostgreSQL (生產環境規劃)
- **Architecture:** 模組化 Controller-Service-Repository 分層架構

### 前端 (Frontend)
- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **UI Library:** Naive UI
- **State Management:** Pinia
- **HTTP Client:** Axios

## 📂 專案核心進度 (Milestones)

- ✅ **Phase 1-3 後端核心模組與 API**：已完成患者(Patients)、員工(Staff)、療程(Treatments)與分潤(Revenue)等模組，全數通過單元與整合測試（高達 400+ 測試用例，A 級代碼質量）。
- ✅ **Phase 4 前端基礎介面**：Vue 3 專案初始化完備，完成了員工、病患、療程模板與分潤規則的 CRUD 與狀態顯示。
- ⏳ **Phase 4 深度整合**：優化分潤階梯配置 UI、療程排程日曆視圖以及 ECharts 業績儀表板。
- ⏳ **Phase 5 測試與部署**：加強 E2E 測試與醫療級 Audit Log，及 Docker/CI/CD 端到端部署準備。

>詳細後續發展藍圖，請見根目錄下的 **`Gemini3.1Plan.md`** 與 **`CRMplan.md`**。

## 🛠️ 開發環境設置 (Local Development Setup)

### 先決條件
- Node.js (v18 或以上)
- npm 

### 安裝步驟

1. **複製專案本機**
   ```bash
   git clone https://github.com/hsuyungfeng/DrtooboxCRM.git
   cd DrtooboxCRM
   ```

2. **安裝依賴套件與執行**
   - 請根據各自的 `backend` 與 `frontend` 資料夾中的 `package.json` 安裝依賴。
   
3. *(選項)* **啟動開發伺服器**
   ```bash
   # 若您進入 backend 目錄：
   nom run start:dev
   
   # 若您進入 frontend 目錄：
   npm run dev
   ```

## 🔒 各層級安全與驗證

- 所有 API 請求經過 JWT 驗證並且須夾帶 `X-Clinic-Id` / Query `clinicId` 的強制隔離過濾。
- 財務記錄 (`RevenueRecord`) 的不可竄改性：一旦寫入 `locked_at` 將拒絕任何形式的原地刪除與覆寫。所有更改必須透過 `RevenueAdjustment` 送審。

## 👨‍💻 作者

- **hsuyungfeng**

---
*這是一個積極開發中的專案。我們不僅為了販售設計功能，更是為了解決實際醫療產業在人員分帳與療程確實執行的核心痛點。*
