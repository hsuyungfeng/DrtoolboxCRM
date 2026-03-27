# Treatments 管理 UI & PPF 分潤計算引擎設計文檔

**日期**: 2026-02-10
**版本**: 1.0
**狀態**: 已驗證 ✅

---

## 📋 概述

本文檔定義 Doctor CRM 的核心功能模組：
- **Treatments 管理 UI** - 療程 CRUD + 定價管理 + 預約提醒
- **PPF 分潤計算引擎** - 自動計算多角色分潤，支持靈活規則

---

## 1️⃣ 整體架構設計

### 架構層級

```
┌─────────────────────────────────────────────────┐
│ Frontend Layer (Vue 3 + Naive UI)               │
│ - TreatmentsView.vue                            │
│ - TreatmentDetailModal.vue                      │
└────────────────┬────────────────────────────────┘
                 │ API calls
┌────────────────▼────────────────────────────────┐
│ API Layer (NestJS Controllers)                  │
│ - TreatmentsController                          │
│ - RevenuePPFController                          │
└────────────────┬────────────────────────────────┘
                 │ Service calls
┌────────────────▼────────────────────────────────┐
│ Service Layer (Business Logic)                  │
│ - TreatmentsService                             │
│ - RevenueCalculationService (核心)              │
│ - RevenueRuleEngine                             │
└────────────────┬────────────────────────────────┘
                 │ Repository calls
┌────────────────▼────────────────────────────────┐
│ Data Layer (TypeORM)                            │
│ - Treatment / TreatmentSession                  │
│ - RevenueRule / RevenueRecord                   │
│ - Staff / TreatmentStaffAssignment              │
└─────────────────────────────────────────────────┘
```

### 關鍵設計原則

- **RevenueCalculationService 只依賴 RevenueRule 定義** - 與具體業務邏輯解耦
- **所有分潤計算都記錄到 RevenueRecord** - 財務審計追蹤
- **自動觸發計算** - TreatmentSession 完成 → 自動計算 → 寫入 RevenueRecord
- **locked_at 設計** - 防止已確認的分潤被修改

---

## 2️⃣ Treatments 管理 UI 設計

### 第一階段目標：基礎 CRUD + 定價管理

#### 頁面結構

```
┌─────────────────────────────────────────┐
│ 療程管理  [+ 新增療程] [刷新]            │
├─────────────────────────────────────────┤
│ 篩選：患者名稱 ___  狀態 [dropdown]      │
├─────────────────────────────────────────┤
│ 療程列表 (Data Table)                   │
│ ┌───────────────────────────────────────┤
│ │ID│患者│名稱│實際價格│進度│狀態│操作  │
│ │──┼────┼───┼───┼──┼──┼──│
│ │uu│王先│美白│3000│1/5│進│編|刪 │
│ └───────────────────────────────────────┤
└─────────────────────────────────────────┘
```

#### 新增/編輯模態框

```
┌────────────────────────────────────┐
│ 新增療程                            │
├────────────────────────────────────┤
│ 患者 *              [患者下拉▼]      │
│ 療程名稱 *          [模板下拉▼]      │
│                                    │
│ ─── 定價 ───                       │
│ 建議售價            ¥ 3000 (唯讀)   │
│ 實際售價 *          ¥ [可編輯欄]    │
│                                    │
│ ─── 療程進度 ───                   │
│ 總次數 *            [整數輸入]      │
│ 預期完成日期 *      [日期選擇]      │
│ 預約提醒            ☑ 啟用提醒      │
│                                    │
│ ─── 其他 ───                       │
│ 備註                [文本框]        │
│                                    │
├────────────────────────────────────┤
│ [確認] [取消]                       │
└────────────────────────────────────┘
```

#### 核心欄位定義

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| 患者 | 下拉 | ✅ | 集成患者列表 |
| 療程名稱 | 下拉 | ✅ | 預定義模板（如「牙齒美白」） |
| 建議售價 | 唯讀 | - | 來自療程模板，自動帶入 |
| **實際售價** | **輸入** | **✅** | **允許覆蓋建議價格** |
| 總次數 | 輸入 | ✅ | 整數，療程總執行次數 |
| 預期完成日期 | 日期 | ✅ | 用於預約提醒計算 |
| 預約提醒 | 複選框 | - | 啟用/關閉預約提醒 |
| 狀態 | 下拉 | ✅ | pending / in_progress / completed / cancelled |
| 備註 | 文本框 | - | 可選備註 |

#### 操作流程

1. 選擇「療程名稱」(模板) → 自動帶入「建議售價」
2. 用戶可修改「實際售價」（允許覆蓋）
3. 設定「預期完成日期」+ 啟用「預約提醒」
4. 保存 → 新增 Treatment 記錄

---

## 3️⃣ PPF 分潤計算引擎

### 核心流程圖

```
TreatmentSession 狀態變更為 completed
    ↓
觸發事件 → RevenueCalculationService.calculateForSession(sessionId)
    ↓
1. 查詢該 Session 所屬的 Treatment (totalPrice = 實際售價)
2. 查詢 Treatment 的所有 StaffAssignment
3. 對每個 Staff，查詢他的 Role 對應的 RevenueRule
4. 根據 Rule.rule_type 計算分潤金額：
   - Percentage: amount = totalPrice × percentage
   - Fixed: amount = fixed_amount
   - Tiered: 根據 totalPrice 在階級中的位置計算
5. 新增 RevenueRecord 記錄
    ↓
RevenueRecord 寫入 DB (locked_at = null，表示可調整)
```

### RevenueRule 資料結構

#### 表結構
```sql
CREATE TABLE revenue_rules (
  id UUID PRIMARY KEY,
  role VARCHAR(50) NOT NULL,           -- "doctor", "therapist", "assistant"
  rule_type VARCHAR(50) NOT NULL,      -- "percentage", "fixed", "tiered"
  rule_payload JSON NOT NULL,          -- 規則詳情 (見下方)
  is_active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE NULLABLE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Rule Payload 範例

**Percentage（百分比）**
```json
{
  "percentage": 50
}
```

**Fixed（固定金額）**
```json
{
  "fixed_amount": 500
}
```

**Tiered（階梯式）- 預留架構**
```json
{
  "tiers": [
    { "from_amount": 0, "to_amount": 1000, "percentage": 40 },
    { "from_amount": 1000, "to_amount": 5000, "percentage": 50 },
    { "from_amount": 5000, "to_amount": null, "percentage": 60 }
  ]
}
```

### 計算範例

```
Treatment: 牙齒美白
├─ totalPrice: 3000 (實際售價)
├─ staff_assignments:
│  ├─ Doctor A (role: "doctor")
│  │   ├─ rule_type: "percentage"
│  │   └─ percentage: 50%
│  │   → 分潤 = 3000 × 50% = 1500
│  └─ Therapist B (role: "therapist")
│      ├─ rule_type: "percentage"
│      └─ percentage: 30%
│      → 分潤 = 3000 × 30% = 900
│
└─ 新增 RevenueRecords:
   ├─ { staffId: "docA", amount: 1500, calculated_at: now, locked_at: null }
   └─ { staffId: "therapB", amount: 900, calculated_at: now, locked_at: null }
```

### 支持的 Rule Type

| 類型 | 說明 | 使用場景 |
|------|------|--------|
| **Percentage** | 百分比分潤 | 大多數情況（如主治醫師 60%） |
| **Fixed** | 固定金額 | 特定服務（如掛號費 ¥100） |
| **Tiered** | 階梯式分潤 | 業績激勵（¥0-1k 40%, ¥1-5k 50%） |

---

## 4️⃣ 實施計畫

### Phase 1: Backend Services
- [ ] TreatmentsService - CRUD 邏輯
- [ ] RevenueCalculationService - 分潤計算核心
- [ ] RevenueRuleEngine - 規則解析
- [ ] TreatmentsController - API endpoints

### Phase 2: Frontend
- [ ] TreatmentsView.vue - 主頁面
- [ ] TreatmentModal.vue - 新增/編輯
- [ ] 集成患者下拉選擇
- [ ] 集成療程模板

### Phase 3: 測試 & 部署
- [ ] 單元測試（RevenueCalculationService）
- [ ] 集成測試（E2E 流程）
- [ ] 前端測試

---

## 5️⃣ 關鍵技術決策

| 決策 | 理由 |
|------|------|
| **自動計算分潤** | 即時準確，減少人工錯誤 |
| **RevenueRule 解耦** | 支持未來擴展到階梯式、條件式 |
| **locked_at 設計** | 財務審計級別的不可竄改 |
| **JSON payload** | 靈活支持多種規則類型 |

---

## 6️⃣ 風險與緩解

| 風險 | 緩解方案 |
|------|--------|
| 分潤計算錯誤影響財務 | 所有計算都記錄 RevenueRecord，可追溯 |
| 規則複雜度高 | 第一階段只做百分比+固定，分階段擴展 |
| 前端複雜性 | 分模態框職責，每個只負責一個邏輯 |

---

## ✅ 驗證清單

- [x] 整體架構獲得用戶確認
- [x] Treatments UI 設計獲得確認
- [x] PPF 引擎邏輯獲得確認
- [ ] 準備進入實施階段

---

**文檔簽核**: 設計方案已驗證，准許進行實施
**下一步**: 進入 implementation 階段
