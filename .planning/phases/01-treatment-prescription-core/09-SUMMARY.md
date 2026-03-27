---
phase: 01-treatment-prescription-core
plan: 09
subsystem: frontend-medical-orders
tags: [vue3, naive-ui, medical-orders, frontend, ui]
dependency_graph:
  requires: [01-04]
  provides: [medical-order-list-view, medical-order-form, medical-order-detail-view, medical-orders-api-service]
  affects: [frontend-router]
tech_stack:
  added: [medical-orders-api.ts]
  patterns: [naive-ui-form-validation, remote-patient-search, progress-tracking-ui]
key_files:
  created:
    - frontend/src/services/medical-orders-api.ts
    - frontend/src/components/MedicalOrderForm.vue
    - frontend/src/views/MedicalOrderList.vue
    - frontend/src/views/MedicalOrderDetail.vue
  modified:
    - frontend/src/router/index.ts
decisions:
  - MedicalOrderTable 以 render function 內嵌於 MedicalOrderList.vue，避免獨立組件額外建立
  - medical-orders-api.ts 欄位使用英文屬性名與後端 DTO 一致（drugOrTreatmentName、dosage、usageMethod、totalUsage）
  - 路由新增 /medical-orders 和 /medical-orders/:id 支援醫師管理視圖
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 09：前端醫令管理 UI 組件 摘要

## 一句話摘要

使用 Vue 3 + Naive UI 建立醫令管理完整前端，含 API 服務層、表單、列表（按狀態分標籤頁）和詳情（含進度條）組件。

---

## 已完成任務

| 任務 | 名稱 | 提交 | 主要檔案 |
|------|------|------|----------|
| 1 | 建立 MedicalOrderForm 和 MedicalOrderList 組件 | 145ef463 | medical-orders-api.ts, MedicalOrderForm.vue, MedicalOrderList.vue |
| 2 | 建立 MedicalOrderDetail 組件 | 5151fa85 | MedicalOrderDetail.vue, router/index.ts |

---

## 建立內容

### medical-orders-api.ts
- 完整 TypeScript 介面定義（MedicalOrder、CreateMedicalOrderData、UpdateMedicalOrderData）
- API 方法：createOrder、getOrder、updateOrder、getOrders、getPatientOrders、recordUsage、cancelOrder
- 使用 `http` 工具（來自 `@/services/api`）與後端通訊

### MedicalOrderForm.vue
- 患者遠端搜尋（整合 patientsApi）
- 欄位：藥物或治療名稱、說明、劑量、使用方式、療程數
- Naive UI FormRules 驗證
- 支援新增和編輯模式（透過 props.order watch）

### MedicalOrderList.vue
- 標籤頁：全部 / 待開始 / 進行中 / 已完成
- 內嵌 MedicalOrderTable（render function 實作）顯示資料表格
- 對話框整合 MedicalOrderForm
- 操作：開立醫令、編輯、取消

### MedicalOrderDetail.vue
- 基本資訊展示（患者、狀態、劑量、使用方式、說明）
- n-progress 進度條視覺化使用百分比
- 狀態按鈕：「開始使用」（pending→in_progress）、「記錄使用」、「取消醫令」
- 「記錄使用」對話框含最大次數限制

### router/index.ts（修改）
- 新增 `/medical-orders` → MedicalOrderList
- 新增 `/medical-orders/:id` → MedicalOrderDetail

---

## 決策記錄

1. **MedicalOrderTable 內嵌**：使用 Vue render function 在 MedicalOrderList.vue 內定義表格組件，避免建立額外的單一用途組件檔案。

2. **英文屬性名**：`medical-orders-api.ts` 介面欄位採英文命名（`drugOrTreatmentName`、`dosage`、`usageMethod`、`totalUsage`）與後端 DTO 保持一致，表單 label 顯示中文。

3. **路由整合**：直接在既有 `router/index.ts` 中新增醫令相關路由，維持路由管理集中化。

---

## 計劃偏差

無 - 計劃完全按原定方案執行。

---

## Self-Check: PASSED

- frontend/src/services/medical-orders-api.ts: FOUND
- frontend/src/components/MedicalOrderForm.vue: FOUND
- frontend/src/views/MedicalOrderList.vue: FOUND
- frontend/src/views/MedicalOrderDetail.vue: FOUND
- Commit 145ef463: FOUND
- Commit 5151fa85: FOUND
