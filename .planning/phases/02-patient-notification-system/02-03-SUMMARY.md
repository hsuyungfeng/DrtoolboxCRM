---
phase: "02"
plan: "03"
subsystem: notifications
tags: [event-listener, scheduler, cron, nestjs-schedule, multi-channel]
dependency_graph:
  requires:
    - "02-01"  # 事件 emit（CourseStartedEvent、CourseCompletedEvent、session.completed）
    - "02-02"  # NotificationService.sendMultiChannel() + NotificationRecord 持久化
  provides:
    - NotificationEventListener（三個 @OnEvent 訂閱）
    - NotificationSchedulerService（每日 08:00 預約提醒 Cron job）
  affects:
    - notifications.module.ts（加入新 providers 與 ScheduleModule.forRoot()）
tech_stack:
  added:
    - "@nestjs/schedule"
  patterns:
    - "@OnEvent + try/catch 不拋出（避免影響其他 Listener）"
    - "@Cron with timeZone + DATE() SQLite 安全查詢"
key_files:
  created:
    - backend/src/notifications/listeners/notification-event.listener.ts
    - backend/src/notifications/listeners/notification-event.listener.spec.ts
    - backend/src/notifications/services/notification-scheduler.service.ts
    - backend/src/notifications/services/notification-scheduler.service.spec.ts
  modified:
    - backend/src/notifications/notifications.module.ts
    - backend/package.json
decisions:
  - "@nestjs/schedule 在 NotificationsModule 中 forRoot()，未在 app.module.ts 中預先載入"
  - "NotificationEventListener 三個 handler 各自獨立 try/catch，不重新拋出，確保 RevenueEventListener 不受影響"
  - "Cron 使用 DATE(session.scheduledDate) 而非直接比較 datetime，處理 SQLite 字串日期欄位"
metrics:
  duration: "164 seconds"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 02 Plan 03：通知事件監聽器與排程服務 總結

**一行摘要：** 建立 NotificationEventListener 訂閱三個療程生命週期事件 + NotificationSchedulerService 每日 08:00（台北時間）掃描明天 pending session 發送預約提醒，9 項新增單元測試全部通過。

---

## 完成任務

| 任務 | 名稱 | 提交 | 關鍵檔案 |
|------|------|------|----------|
| 1 | NotificationEventListener（NOTIF-01/02/03） | 2cf0c80f | notification-event.listener.ts/spec.ts |
| 2 | NotificationSchedulerService + NotificationsModule（NOTIF-04） | 7b3082b1 | notification-scheduler.service.ts/spec.ts, notifications.module.ts |

---

## 技術實作細節

### NotificationEventListener

- 訂閱 `course.started`、`session.completed`、`course.completed` 三個事件
- 每個 handler：`@InjectRepository(Patient)` 查詢患者 → 呼叫 `sendMultiChannel` → try/catch 不重新拋出
- 患者不存在時提前返回（logger.warn），確保不發出通知
- 完全遵循 `RevenueEventListener` 的 try/catch 模式，避免單一 Listener 失敗影響其他

### NotificationSchedulerService

- `@Cron('0 8 * * *', { timeZone: 'Asia/Taipei' })` 每天早上 08:00 台北時間執行
- 使用 `DATE(session.scheduledDate) = :date` 處理 SQLite 字串日期欄位（研究報告陷阱 4）
- `leftJoinAndSelect` 載入 `treatmentCourse.patient` 關聯
- 每個 session 獨立 try/catch，單個失敗不中斷整批次

### NotificationsModule 更新

- 加入 `ScheduleModule.forRoot()`
- 加入 `NotificationSchedulerService`、`NotificationEventListener` 到 providers

---

## 測試覆蓋

| 測試檔案 | 測試數 | 覆蓋場景 |
|----------|--------|----------|
| notification-event.listener.spec.ts | 5 | 三個事件 handler、患者不存在、例外不拋出 |
| notification-scheduler.service.spec.ts | 4 | 找到 session、無 session、無患者、批次失敗繼續 |

**合計：9 項新測試，全部通過**

---

## 偏差記錄

### 自動修正問題

**1. [Rule 3 - Blocking] 安裝 @nestjs/schedule 套件**
- **發生於：** 任務 2
- **問題：** `notification-scheduler.service.ts` 使用 `@Cron` decorator，但 `@nestjs/schedule` 未安裝
- **修正：** `npm install @nestjs/schedule`
- **修改檔案：** backend/package.json, backend/package-lock.json
- **提交：** a2f496bd

---

## 自我檢查

### 檔案存在確認

- backend/src/notifications/listeners/notification-event.listener.ts: 存在
- backend/src/notifications/listeners/notification-event.listener.spec.ts: 存在
- backend/src/notifications/services/notification-scheduler.service.ts: 存在
- backend/src/notifications/services/notification-scheduler.service.spec.ts: 存在
- backend/src/notifications/notifications.module.ts: 已更新

### 提交確認

- 2cf0c80f: feat(02-03): 建立 NotificationEventListener
- 7b3082b1: feat(02-03): 建立 NotificationSchedulerService 並更新 NotificationsModule
- a2f496bd: chore(02-03): 安裝 @nestjs/schedule 套件

## Self-Check: PASSED
