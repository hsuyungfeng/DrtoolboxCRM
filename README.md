# Doctor CRM 醫療療程管理系統

專為醫療機構設計的客戶關係管理系統，核心功能圍繞「療程執行、分潤計算、員工管理」三大模塊。

## 版本資訊
- **當前版本**：v1.2 (受信任整合優化版)
- **最後更新**：2026年4月27日
- **狀態**：✅ 完全就緒 🚀

## 功能特色

### 核心功能
- **患者管理**：完整的患者檔案管理，支援動態自定義欄位。
- **療程管理**：療程規劃與追蹤，支援多次療程記錄與醫令管理。
- **員工管理**：醫師、治療師、助理等角色管理，支援即時自動開戶。
- **安全性**：全局 `ClinicGuard` 與 `JwtAuthGuard` 雙重保護，確保嚴格的數據隔離。

### Doctor Toolbox 深度整合 (v1.2 ✅)
- **免註冊 SSO**：透過加密 URL 自動登入，**完全不需要手動註冊或輸入密碼**。
- **區域網路免登入模式**：專為診所內網與 App 容器設計，透過受信任金鑰（App Key）實現無感存取。
- **即時自動開戶 (JIT)**：新醫師第一次訪問即自動建立帳號並分配權限。
- **雙向數據同步**：支援 Webhook 實時同步與事件驅動同步。

## 技術棧
- **後端**：NestJS 11.x + PostgreSQL / SQLite
- **前端**：Vue 3.5 + Naive UI
- **安全性**：HMAC-SHA256 (SSO) + X-App-Key (受信任整合) + JWT

## 快速開始

### 啟動服務
```bash
# 後端
cd backend && npm run start:dev

# 前端
cd frontend && npm run dev
```

## Doctor Toolbox 整合指引

本系統提供兩種整合方式，均支援 **「免註冊、免登入」**：

### 方案 A：Web SSO 模式 (適用於外部跳轉)
透過 HMAC 簽名驗證身分。

**URL 格式：**
`http://<crm-url>/login?clinicId={CID}&staffId={UID}&name={NAME}&role={ROLE}&ts={TS}&sig={SIG}`

*   **簽名計算**：對 `{ts}.{staffId}.{clinicId}.{name}.{role}` 進行 HMAC-SHA256 加密。
*   **Key**：使用 `.env` 中的 `DOCTOR_TOOLBOX_WEBHOOK_SECRET`。

### 方案 B：受信任 App 模式 (適用於區域網路/App 嵌入)
透過預共享金鑰（Pre-shared Key）直接放行。

**URL 格式：**
`http://<crm-url>/?mode=integrated&clinicId={CID}`

**設定步驟：**
1.  在 `.env` 中設定 `TRUSTED_APP_KEY=你的金鑰`。
2.  App 在發送請求時，Header 需帶上 `X-App-Key: 你的金鑰`。
3.  前端偵測到 `mode=integrated` 時會自動進入受信任狀態，跳過登入介面。

## 專案階段

| 階段 | 狀態 | 主要交付 | 完成日期 |
|------|------|--------|--------|
| **Phase 1-4** | ✅ 完成 | 核心系統、通知系統、財務管理、Toolbox 入站整合 | 2026-03-31 |
| **Phase 5** | ✅ 完成 | **出站同步、SSO 自動登入、JIT 開戶、PostgreSQL 優化** | 2026-04-27 |
| **Phase 5.1** | ✅ 完成 | **區域網路免登入模式 (Trusted Integration)** | 2026-04-27 |
| **Phase 6** | ✅ 完成 | **核心業務流程重構 (醫令自動生成、動態分潤、回診通知)** | 2026-04-30 |
| **Phase 7** | ✅ 完成 | **高級數據分析與自動對帳系統 (JSONB 聚合、每日自動核驗)** | 2026-04-30 |

## 聯絡與支援
- **API 文檔**：http://localhost:3000/api/docs
- **整合詳情**：參見 `docs/INTEGRATION_GUIDE.md` 與 `Crmimprove0427.md`
