---
phase: 02-patient-notification-system
plan: "02"
subsystem: database
tags: [typeorm, notifications, sqlite, nestjs, tdd]

# Dependency graph
requires:
  - phase: 02-patient-notification-system
    provides: Plan 01 事件基礎架構（CourseStartedEvent / CourseCompletedEvent）
provides:
  - TypeORM NotificationRecord 實體（notification_records 資料表）
  - TypeORM NotificationPreference 實體（notification_preferences 資料表）
  - NotificationService.sendMultiChannel()（多渠道通知持久化）
  - 保留向後相容 sendChurnRiskAlert() / sendBulkChurnAlerts() / sendNotification()
  - CreateNotificationPreferenceDto / NotificationInboxQueryDto
affects:
  - 02-patient-notification-system/02-03（通知管理 API）

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TypeORM 實體多索引設計（@Index(['clinicId', 'patientId'])）
    - 「偏好缺席預設全渠道」模式（pref?.emailEnabled ?? true）
    - Promise.allSettled 並行渠道發送（不因單一渠道失敗而中斷）
    - TDD 流程：RED（spec 先行）→ GREEN（實作）→ 一次完成

key-files:
  created:
    - backend/src/notifications/entities/notification-record.entity.ts
    - backend/src/notifications/entities/notification-preference.entity.ts
    - backend/src/notifications/dto/create-notification-preference.dto.ts
    - backend/src/notifications/dto/notification-inbox-query.dto.ts
    - backend/src/notifications/services/notification.service.ts
    - backend/src/notifications/services/notification.service.spec.ts
  modified:
    - backend/src/notifications/notifications.module.ts
    - backend/src/notifications/notifications.controller.ts

key-decisions:
  - "NotificationRecord 記錄每次發送嘗試（含 channel 欄位），支援多渠道分別追蹤"
  - "偏好缺席時預設全渠道啟用，避免首次使用患者漏接通知"
  - "in_app 渠道 status 設為 sent（儲存即送達），email/sms 設為 pending（等待 Plan 03 發送服務）"
  - "NotificationService 移至 services/ 子目錄，controller import 路徑同步更新"
  - "sendChurnRiskAlert() 保留原始介面（ChurnPredictionService 向後相容）"

patterns-established:
  - "多渠道發送：查詢偏好 → 檢查事件偏好 → 各渠道 saveRecord → Promise.allSettled"
  - "事件偏好 map：eventType 字串映射到 NotificationPreference 欄位鍵名"

requirements-completed:
  - NOTIF-05

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 2 Plan 02：通知持久化實體與核心服務重構 Summary

**兩個 TypeORM 實體（notification_records / notification_preferences）+ 重構 NotificationService 以支援多渠道持久化通知，並保留 ChurnPredictionService 向後相容介面**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T11:29:59Z
- **Completed:** 2026-03-27T11:33:23Z
- **Tasks:** 2（含 TDD 子階段）
- **Files modified:** 8（4 新建實體/DTO + 2 新建 services + 2 更新）

## Accomplishments

- 建立 `notification_records` 與 `notification_preferences` TypeORM 實體，含複合索引與唯一約束
- 重構 `NotificationService` 從記憶體陣列改為 TypeORM 持久化，新增 `sendMultiChannel()` 方法
- 保留所有舊方法（`sendChurnRiskAlert` / `sendBulkChurnAlerts` / `sendNotification`）確保向後相容
- 以 TDD 流程完成：5 個單元測試全部通過

## Task Commits

每個任務皆以 atomic commit 提交：

1. **Task 1: 建立 NotificationRecord 與 NotificationPreference 實體及 DTO** - `a8f6a93b` (feat)
2. **Task 2 RED: 加入 NotificationService 失敗測試（TDD RED 階段）** - `bd9e8ea2` (test)
3. **Task 2 GREEN: 重構 NotificationService，加入 sendMultiChannel()** - `4ad994cc` (feat)

**計劃元資料：** `（此 commit）` (docs: complete plan)

_Note: TDD Task 2 有兩個 commits（test RED → feat GREEN）_

## Files Created/Modified

- `backend/src/notifications/entities/notification-record.entity.ts` — TypeORM 實體：notification_records 資料表
- `backend/src/notifications/entities/notification-preference.entity.ts` — TypeORM 實體：notification_preferences 資料表（(clinicId, patientId) 唯一約束）
- `backend/src/notifications/dto/create-notification-preference.dto.ts` — 偏好設定 DTO
- `backend/src/notifications/dto/notification-inbox-query.dto.ts` — 收件匣查詢 DTO
- `backend/src/notifications/services/notification.service.ts` — 重構後的 NotificationService（TypeORM 持久化）
- `backend/src/notifications/services/notification.service.spec.ts` — 5 個單元測試
- `backend/src/notifications/notifications.module.ts` — 更新引入新實體與新服務路徑
- `backend/src/notifications/notifications.controller.ts` — 更新 import 路徑至 services/ 子目錄

## Decisions Made

- `NotificationRecord` 記錄每次發送嘗試（含 channel 欄位），支援多渠道分別追蹤狀態
- 偏好缺席時預設全渠道啟用（`pref?.emailEnabled ?? true`），避免首次使用患者漏接通知
- `in_app` 渠道 status 直接設為 `sent`（儲存即送達）；`email`/`sms` 設為 `pending`，等待 Plan 03 外部發送服務
- `NotificationService` 移至 `services/` 子目錄，controller import 路徑同步更新（Rule 3 自動處理）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 更新 notifications.controller.ts import 路徑**
- **Found during:** Task 2（更新 notifications.module.ts）
- **Issue:** controller 仍 import 舊路徑 `./notification.service`，服務移至 `services/` 後會破壞編譯
- **Fix:** 更新 controller 的兩個 import 語句至 `./services/notification.service`
- **Files modified:** backend/src/notifications/notifications.controller.ts
- **Verification:** TypeScript 編譯無 notification 相關錯誤
- **Committed in:** `4ad994cc`（Task 2 GREEN commit）

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** 計劃本身已預見此需求（action 步驟 3 備注），屬於必要修正。無範圍蔓延。

## Issues Encountered

無 — 所有工作按計劃進行，TypeScript 編譯無通知相關錯誤，5 個測試全部通過。

## User Setup Required

無 — 不需要外部服務設定。

## Next Phase Readiness

- Plan 02 完成後，`NotificationService.sendMultiChannel()` 可供 Plan 01 事件 Listener 呼叫
- `notification_records` 資料表結構就位，Plan 03 可直接建立 inbox API
- 舊介面保留，`ChurnPredictionService` 無需修改

---
*Phase: 02-patient-notification-system*
*Completed: 2026-03-27*

## Self-Check: PASSED

- FOUND: notification-record.entity.ts
- FOUND: notification-preference.entity.ts
- FOUND: create-notification-preference.dto.ts
- FOUND: notification-inbox-query.dto.ts
- FOUND: services/notification.service.ts
- FOUND: services/notification.service.spec.ts
- FOUND: 02-02-SUMMARY.md
- FOUND commit: a8f6a93b（Task 1）
- FOUND commit: bd9e8ea2（Task 2 RED）
- FOUND commit: 4ad994cc（Task 2 GREEN）
