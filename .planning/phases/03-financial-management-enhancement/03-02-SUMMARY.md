---
phase: "03"
plan: "02"
subsystem: revenue
tags: [invoice, fee-calculation, multi-tenant, tdd, typescript]
dependency_graph:
  requires: ["03-01"]
  provides: [InvoiceService, InvoiceController, Invoice entity]
  affects: [RevenueModule]
tech_stack:
  added: []
  patterns: [TDD-RED-GREEN, TypeORM-ManyToOne, JSON-column, optimistic-locking, status-machine]
key_files:
  created:
    - backend/src/revenue/entities/invoice.entity.ts
    - backend/src/revenue/dto/create-invoice.dto.ts
    - backend/src/revenue/services/invoice.service.ts
    - backend/src/revenue/services/invoice.service.spec.ts
    - backend/src/revenue/controllers/invoice.controller.ts
  modified:
    - backend/src/revenue/revenue.module.ts
decisions:
  - "Invoice lineItems 採 JSON 欄位儲存，避免額外建立 invoice_line_items 表（Rule 2：符合計劃設計）"
  - "GET treatment/:treatmentId 路由定義在 GET :id 之前，避免 Express 路由衝突（Rule 1）"
  - "invoiceNumber 序號按診所範圍按月遞增，不跨診所共享序號，確保多租戶隔離"
  - "cancelReason 欄位長度設為 255（計劃指定 32，實際應用場景需要更長說明文字）"
metrics:
  duration_minutes: 39
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 03 Plan 02：發票系統 Summary

**一句話摘要：** 建立完整的 Invoice 實體與服務，實現台灣稅務需求的發票生成（INV-{YYYYMM}-{序號}格式）、狀態機（draft→issued→cancelled）、重複開立防護與費用明細自動生成，搭配 6 個 REST API 端點。

---

## 完成任務

| 任務 | 名稱 | 提交 | 關鍵檔案 |
|------|------|------|---------|
| 1 | Invoice 實體與 InvoiceService | 39049263 | invoice.entity.ts, invoice.service.ts, invoice.service.spec.ts |
| 2 | InvoiceController 與 RevenueModule 更新 | 2f52c7f7 | invoice.controller.ts, revenue.module.ts |

---

## 技術細節

### Invoice 實體設計

- **invoiceNumber**：唯一索引，格式 `INV-{YYYYMM}-{6位序號}`（例：INV-202603-000001）
- **lineItems**：JSON 欄位，儲存 `InvoiceLineItem[]`，每項對應一筆 Payment 記錄
- **status**：`draft | issued | cancelled`，使用樂觀鎖（`@VersionColumn`）防止並發更新
- **多租戶隔離**：所有查詢帶 `clinicId` 條件

### InvoiceService 核心邏輯

- **create**：
  1. 檢查是否已存在 `issued` 發票（ConflictException）
  2. 呼叫 `FeeCalculationService.calculateBalance()` 取得付款明細
  3. 自動生成 `lineItems`（含中文支付方式標籤：現金、銀行轉帳、刷卡）
  4. 呼叫 `generateInvoiceNumber()` 生成唯一流水號
  5. 儲存為 `draft` 狀態

- **issue**：`draft → issued`，設定 `issuedAt`；非 draft 狀態拋出 BadRequestException
- **cancel**：`draft/issued → cancelled`，設定 `cancelledAt + cancelReason`；已取消者再次取消拋出 BadRequestException

### InvoiceController REST API

| 方法 | 路徑 | 功能 |
|------|------|------|
| POST | /invoices | 生成草稿發票（FIN-04） |
| GET | /invoices/treatment/:id | 療程所有發票 |
| GET | /invoices/patient/:id | 患者所有發票 |
| GET | /invoices/:id | 發票詳情（FIN-03） |
| PATCH | /invoices/:id/issue | 開立發票 |
| PATCH | /invoices/:id/cancel | 取消發票 |

---

## 測試結果

- 10 項單元測試全部通過（含計劃要求的 6 個行為測試）
- `npm run build` 零 TypeScript 錯誤

---

## 決策記錄

1. **lineItems 採 JSON 欄位**：避免額外建立 `invoice_line_items` 關聯表，符合計劃設計，簡化查詢。

2. **路由順序防衝突**：`GET /invoices/treatment/:id` 定義在 `GET /invoices/:id` 之前，避免 Express 路由匹配衝突（同 Plan 01-04 決策模式）。

3. **invoiceNumber 按診所隔離**：序號生成查詢加入 `clinicId` 條件，確保不同診所序號互不干擾。

4. **cancelReason 長度調整**：計劃指定 `varchar(32)`，實際取消原因可能超過 32 字（如「因患者療程取消，相關費用退款申請已提出」），調整為 `varchar(255)` 更符合實際需求。

---

## 計劃偏差

### 自動修正問題

**1. [Rule 1 - 長度調整] cancelReason 欄位長度由 32 增至 255**
- **發現於：** Task 1 實作 Invoice 實體時
- **問題：** 計劃範本指定 `varchar(32)`，但實際取消原因說明通常超過 32 個字元
- **修正：** 將 `cancelReason` 欄位長度設為 `varchar(255)`
- **修改檔案：** backend/src/revenue/entities/invoice.entity.ts

其餘部分計劃執行完全符合計劃規格。

---

## Self-Check: PASSED

| 驗證項目 | 結果 |
|---------|------|
| invoice.entity.ts 存在 | FOUND |
| create-invoice.dto.ts 存在 | FOUND |
| invoice.service.ts 存在 | FOUND |
| invoice.service.spec.ts 存在 | FOUND |
| invoice.controller.ts 存在 | FOUND |
| 提交 39049263 存在 | FOUND |
| 提交 2f52c7f7 存在 | FOUND |
