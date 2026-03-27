---
phase: 02-patient-notification-system
plan: "01"
subsystem: events
tags: [events, event-emitter, treatment-course, treatment-session, notifications]
dependency_graph:
  requires:
    - backend/src/events/session-completed.event.ts
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/services/treatment-session.service.ts
  provides:
    - backend/src/events/course-started.event.ts
    - backend/src/events/course-completed.event.ts
    - course.started 事件 emit 點
    - course.completed 事件 emit 點
  affects:
    - backend/src/treatments/services/treatment-course.service.spec.ts
    - backend/src/treatments/services/treatment-session.service.spec.ts
    - backend/src/treatments/tests/treatment-course.service.spec.ts
tech_stack:
  added:
    - EventEmitter2（@nestjs/event-emitter）注入至 TreatmentCourseService
    - CourseStartedEvent 新事件類別
    - CourseCompletedEvent 新事件類別
  patterns:
    - NestJS EventEmitter2 constructor injection
    - Event class pattern（constructor 參數注入，readonly 欄位，預設時間戳）
key_files:
  created:
    - backend/src/events/course-started.event.ts
    - backend/src/events/course-completed.event.ts
  modified:
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/services/treatment-course.service.spec.ts
    - backend/src/treatments/services/treatment-session.service.ts
    - backend/src/treatments/services/treatment-session.service.spec.ts
    - backend/src/treatments/tests/treatment-course.service.spec.ts
decisions:
  - "CourseStartedEvent 在 createCourse() 事務外 emit，確保 course 已持久化"
  - "CourseCompletedEvent 在事務內（manager.save 之後）emit，EventEmitter2 async 模式確保 Listener 在事務提交後才執行"
  - "tests/ 目錄的 spec 也補入 EventEmitter2 mock，確保現有測試不中斷"
metrics:
  duration: "837s"
  completed_date: "2026-03-27"
  tasks_completed: 3
  files_changed: 7
---

# Phase 2 Plan 01：事件基礎架構 Summary

**一行摘要：** 新增 CourseStartedEvent 與 CourseCompletedEvent 類別，並在療程建立／最後 session 完成時觸發對應事件，為 Phase 2 通知系統建立事件基礎。

## 完成的任務

| 任務 | 名稱 | 提交 | 關鍵檔案 |
|------|------|------|----------|
| 1 | 建立 CourseStartedEvent 與 CourseCompletedEvent 類別 | e8195dad | course-started.event.ts, course-completed.event.ts |
| 2 | TreatmentCourseService 注入 EventEmitter2 並 emit course.started | 184f65c5 | treatment-course.service.ts, treatment-course.service.spec.ts |
| 3 | TreatmentSessionService 最後 session 完成後 emit course.completed | d6a88d0a | treatment-session.service.ts, treatment-session.service.spec.ts |

## 實作細節

### 事件類別

兩個新事件類別均遵循現有 `SessionCompletedEvent` 模式：constructor 參數注入（`readonly`），時間戳欄位有預設值。

**CourseStartedEvent：** courseId, patientId, clinicId, startedAt（預設 new Date()）

**CourseCompletedEvent：** courseId, patientId, clinicId, completedAt（預設 new Date()）

### Emit 點

- `course.started`：在 `TreatmentCourseService.createCourse()` 事務完成、點數兌換（如有）之後、`return course` 之前觸發
- `course.completed`：在 `TreatmentSessionService.completeSession()` Step 6 中，`manager.save(TreatmentCourse, course)` 之後觸發（僅 completedCount === allSessions.length 時）

### 測試覆蓋

- `treatment-course.service.spec.ts`：新增 2 個 course.started emit 測試（pointsToRedeem=0 與 >0 情境）
- `treatment-session.service.spec.ts`：新增 2 個 course.completed emit 測試（最後 session 與非最後 session）
- 全部 79 個測試通過

## 偏差記錄

### 自動修正問題

**1. [Rule 3 - 阻塞問題] 修復 tests/ 目錄 spec 缺少 EventEmitter2 mock**
- **發現於：** 任務 2 執行後
- **問題：** `backend/src/treatments/tests/treatment-course.service.spec.ts` 未提供 EventEmitter2 provider，導致 NestJS DI 容器初始化失敗，29 個測試全部失敗
- **修復：** 加入 `import { EventEmitter2 } from '@nestjs/event-emitter'` 及 `{ provide: EventEmitter2, useValue: { emit: jest.fn() } }` provider
- **修改檔案：** backend/src/treatments/tests/treatment-course.service.spec.ts
- **提交：** 184f65c5（包含於任務 2 提交）

## 決策說明

1. **事務外 emit（course.started）：** createCourse 的 emit 在事務外執行，確保 Listener 可安全讀取已提交的 course 資料
2. **事務內 emit（course.completed）：** EventEmitter2 配置為 `{ async: true }`，Listener 在 event loop 下一輪執行，此時事務已提交，不影響資料完整性
3. **tests/ 補齊 mock：** 屬於 Rule 3 阻塞問題自動修正，非計劃外功能擴充

## 驗證結果

```
Tests: 79 passed, 79 total
Test Suites: 3 passed, 3 total
```

grep 確認：
- `grep "course.started" backend/src/treatments/services/treatment-course.service.ts` ✓
- `grep "course.completed" backend/src/treatments/services/treatment-session.service.ts` ✓

## Self-Check: PASSED
