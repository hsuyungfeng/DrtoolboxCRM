---
phase: 03-financial-management-enhancement
plan: "01"
subsystem: payments
tags: [payment, decimal.js, fee-calculation, typeorm, nestjs, multi-tenant]

requires:
  - phase: 01-treatment-prescription-core
    provides: Treatment 實體（totalPrice, finalPrice, pointsRedeemed）與 clinicId 多租戶模式
  - phase: 02-patient-notification-system
    provides: 無直接依賴（同期階段）

provides:
  - Payment TypeORM 實體（patients 付款記錄，含 paymentMethod/amount/treatmentId/clinicId）
  - FeeCalculationService（Decimal.js 精確費用計算與餘額查詢）
  - PaymentService（付款 CRUD 與餘額查詢代理）
  - PaymentController（5 個 REST 端點，JwtAuthGuard 保護）

affects:
  - 03-02（發票系統 — 依賴 Payment 實體與 FeeCalculationService）
  - 03-03（財務報表 — 依賴 PaymentService 聚合資料）

tech-stack:
  added: []
  patterns:
    - "Decimal.js 精確計算：Decimal.set({ precision: 8, rounding: ROUND_HALF_UP })，toDecimalPlaces(2).toNumber()"
    - "多租戶隔離：clinicId 必須來自 req.user.clinicId（JWT token），不接受用戶端傳入"
    - "軟刪除模式：payment.status = 'cancelled'，不進行實際資料庫刪除"

key-files:
  created:
    - backend/src/revenue/entities/payment.entity.ts
    - backend/src/revenue/dto/create-payment.dto.ts
    - backend/src/revenue/dto/update-payment.dto.ts
    - backend/src/revenue/services/fee-calculation.service.ts
    - backend/src/revenue/services/fee-calculation.service.spec.ts
    - backend/src/revenue/services/payment.service.ts
    - backend/src/revenue/services/payment.service.spec.ts
    - backend/src/revenue/controllers/payment.controller.ts
  modified:
    - backend/src/revenue/revenue.module.ts

key-decisions:
  - "Payment.paymentMethod 使用聯合型別 'cash' | 'bank_transfer' | 'credit_card'，DTO 以 @IsIn() 驗證，Service 層以 as 型別斷言橋接 string 與聯合型別"
  - "FeeCalculationService 使用 finalPrice（扣積點後），finalPrice 為 null 時 fallback 至 totalPrice"
  - "calculateBalance 餘額最小為 0（Decimal.max），超付情況不返回負數"
  - "PaymentController 使用 JwtAuthGuard，clinicId 強制從 req.user.clinicId 取得，不允許用戶端傳入"

patterns-established:
  - "Payment entity TDD：spec 先行，failing tests 確認後實作 service，再以 npm run build 驗證 TypeScript 正確性"
  - "DTO 驗證測試與 service 測試同在一個 spec 檔（fee-calculation.service.spec.ts），降低測試檔數量"

requirements-completed: [FIN-01, FIN-02, FIN-05]

duration: 58min
completed: "2026-03-28"
---

# Phase 3 Plan 01：患者支付記錄系統與費用計算服務 Summary

**Payment TypeORM 實體 + FeeCalculationService（Decimal.js 精確餘額計算）+ PaymentController REST API（5 端點，JwtAuthGuard 多租戶隔離）**

## Performance

- **Duration:** 58 min
- **Started:** 2026-03-27T23:33:36Z
- **Completed:** 2026-03-28T00:31:43Z
- **Tasks:** 2 完成
- **Files modified:** 9（7 新建，2 修改）

## Accomplishments

- Payment 實體建立：含 paymentMethod（三方式）、amount（decimal 20,2）、treatmentId、patientId、clinicId、paidAt、status、version（樂觀鎖）
- FeeCalculationService 使用 Decimal.js 精確計算療程費用餘額，餘額最小為 0（不得為負數）
- PaymentController 提供 5 個 REST 端點（POST/GET×3/DELETE），全部 JwtAuthGuard 保護並強制從 JWT 取 clinicId
- 13 項單元測試全部通過（7 FeeCalculation + 6 Payment），TypeScript build 零錯誤

## Task Commits

各任務獨立提交：

1. **Task 1: Payment 實體、DTO 與 FeeCalculationService** - `a381cc67` (feat)
2. **Task 2: PaymentService、PaymentController 與 RevenueModule 更新** - `c6711537` (feat)

## Files Created/Modified

- `backend/src/revenue/entities/payment.entity.ts` — Payment TypeORM 實體（患者付款記錄）
- `backend/src/revenue/dto/create-payment.dto.ts` — 建立付款 DTO（含 @IsIn 驗證支付方式）
- `backend/src/revenue/dto/update-payment.dto.ts` — 更新付款 DTO（繼承 Create + status）
- `backend/src/revenue/services/fee-calculation.service.ts` — 費用計算服務（Decimal.js 精確）
- `backend/src/revenue/services/fee-calculation.service.spec.ts` — 7 項單元測試
- `backend/src/revenue/services/payment.service.ts` — 付款 CRUD 與餘額查詢代理
- `backend/src/revenue/services/payment.service.spec.ts` — 6 項單元測試
- `backend/src/revenue/controllers/payment.controller.ts` — 5 個 REST 端點控制器
- `backend/src/revenue/revenue.module.ts` — 加入 Payment、PaymentService、FeeCalculationService、PaymentController

## Decisions Made

- `paymentMethod` 在 DTO 為 `string`（class-validator 限制），在 Service 層以 `as 'cash' | 'bank_transfer' | 'credit_card'` 型別斷言轉換，確保 TypeScript 型別安全與 Entity 型別相容
- `FeeCalculationService` 優先使用 `finalPrice`（已扣積點），`finalPrice` 為 null 時 fallback 至 `totalPrice`，與現有 Treatment 實體邏輯一致
- `calculateBalance` 餘額以 `Decimal.max(balance, 0)` 確保不為負數（超付情況）
- PaymentController 所有端點從 `req.user.clinicId` 取得診所 ID，不接受 Body 中傳入，確保多租戶安全隔離

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript 型別不相容：DTO paymentMethod string 無法賦值給 Entity 聯合型別**

- **Found during:** Task 2（npm run build）
- **Issue:** `dto.paymentMethod` 型別為 `string`，Entity 的 `paymentMethod` 為 `'cash' | 'bank_transfer' | 'credit_card'` 聯合型別，展開 `...dto` 時 TypeScript 報錯 TS2769
- **Fix:** 改為逐欄位明確展開，並對 `paymentMethod` 使用 `as 'cash' | 'bank_transfer' | 'credit_card'` 型別斷言
- **Files modified:** `backend/src/revenue/services/payment.service.ts`
- **Verification:** `npm run build` 零錯誤，所有測試仍通過
- **Committed in:** `c6711537`（Task 2 提交）

---

**Total deviations:** 1 auto-fixed（Rule 1 — Bug）
**Impact on plan:** 必要修正，確保 TypeScript 型別正確性，無功能範圍蔓延。

## Issues Encountered

- Jest 不支援 `await import()` 動態匯入（CJS 模式需要 `--experimental-vm-modules`）。改為靜態 import `CreatePaymentDto` 與 `validate` 解決 DTO 驗證測試問題。

## User Setup Required

無 — 無需外部服務配置。

## Next Phase Readiness

- Plan 03-02（發票系統）可直接使用 `Payment` 實體與 `FeeCalculationService.calculateBalance`
- `PaymentController` REST 端點已就緒，前端可開始整合付款記錄 UI
- `RevenueModule` exports 已包含 `PaymentService` 與 `FeeCalculationService`，其他模組可直接注入

---
*Phase: 03-financial-management-enhancement*
*Completed: 2026-03-28*
