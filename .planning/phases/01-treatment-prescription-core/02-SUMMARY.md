---
phase: 01-treatment-prescription-core
plan: 02
subsystem: api
tags: [nestjs, typeorm, treatment, progress, staff-assignment]

# Dependency graph
requires:
  - phase: 01-treatment-prescription-core
    provides: TreatmentCourse and TreatmentSession entities with completionStatus field
provides:
  - TreatmentProgressService with real-time progress calculation from session completion status
  - assignStaffToSession / getStaffAssignmentsForCourse / unassignStaff methods in TreatmentCourseService
  - getCourseWithProgress / getPatientCoursesWithProgress / completeSession methods with auto course status transition
affects:
  - future plans that need treatment progress data
  - staff scheduling and assignment workflows

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Progress derived from session completionStatus in real-time, never stored separately
    - Staff assignment validated via StaffService with clinicId cross-check
    - Auto course status transition when isCourseFinallyCompleted returns true

key-files:
  created:
    - backend/src/treatments/services/treatment-progress.service.ts
  modified:
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/treatments.module.ts
    - backend/src/treatments/services/treatment-course.service.spec.ts

key-decisions:
  - "進度計算從 sessions.completionStatus 即時衍生，不單獨儲存進度欄位以保持資料一致性"
  - "StaffAssignment 使用現有 staffRole 和 ppfPercentage 欄位（無 courseId/clinicId），clinicId 驗證透過 session.clinicId 完成"
  - "StaffModule 匯入 TreatmentsModule 以使用 StaffService 驗證醫護人員存在和診所歸屬"
  - "completeSession 完成後立即重新載入所有 sessions 以確保進度計算正確"

patterns-established:
  - "Pattern 1: 進度計算服務模式 — TreatmentProgressService 接收 TreatmentCourse 物件（含 sessions 關聯）計算進度，不查資料庫"
  - "Pattern 2: 資料一致性驗證鏈 — 分配醫護人員前驗證療程→課程→醫護人員均存在且屬於同一診所"
  - "Pattern 3: 自動狀態轉換 — completeSession 完成後調用 isCourseFinallyCompleted 決定是否將療程標記為 completed"

requirements-completed: [COURSE-03, COURSE-04]

# Metrics
duration: 25min
completed: 2026-03-26
---

# Phase 01 Plan 02: Treatment Progress & Staff Assignment Summary

**TreatmentProgressService 即時從 session completionStatus 計算進度百分比，並在 TreatmentCourseService 中整合醫護人員分配和自動療程完成狀態轉換**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-26T08:36:00Z
- **Completed:** 2026-03-26T09:01:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- 建立 TreatmentProgressService：包含 calculateProgressPercent、getProgress、isCourseFinallyCompleted、calculateProgressForCourses 四個方法
- 擴展 TreatmentCourseService：新增醫護人員分配（assignStaffToSession）、分配查詢（getStaffAssignmentsForCourse）、取消分配（unassignStaff）
- 整合進度計算：getCourseWithProgress、getPatientCoursesWithProgress 附加即時進度物件；completeSession 自動轉換療程狀態

## Task Commits

1. **任務 1：建立 TreatmentProgressService** - `19d7b0e6` (feat)
2. **任務 2：添加醫護人員分配方法** - `8fd617e1` (feat)
3. **任務 3：整合進度計算** - `93184d6a` (feat)

## Files Created/Modified

- `backend/src/treatments/services/treatment-progress.service.ts` - 新建：療程進度計算服務，從 sessions 即時計算進度
- `backend/src/treatments/services/treatment-course.service.ts` - 修改：添加醫護人員分配方法和進度整合方法
- `backend/src/treatments/treatments.module.ts` - 修改：匯入 StaffModule、註冊 TreatmentProgressService
- `backend/src/treatments/services/treatment-course.service.spec.ts` - 修改：添加缺失的 mock providers

## Decisions Made

- **進度即時計算**：進度不儲存為獨立欄位，每次查詢時從 sessions 的 completionStatus 計算，確保資料一致性
- **StaffAssignment 欄位適配**：計劃中的 assignStaffToSession 假設 StaffAssignment 有 courseId/clinicId，但實際實體沒有。改為透過 session.clinicId 驗證診所歸屬
- **StaffModule 匯入**：為了驗證醫護人員存在且屬於正確診所，將 StaffModule 匯入 TreatmentsModule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 適配 StaffAssignment 實際欄位結構**
- **Found during:** Task 2（添加醫護人員分配方法）
- **Issue:** 計劃中的 assignStaffToSession 假設 StaffAssignment 有 courseId、clinicId、assignedAt 欄位，但實際實體只有 sessionId、staffId、staffRole、ppfPercentage、ppfAmount
- **Fix:** 移除不存在的欄位引用；改用 session.clinicId 驗證診所歸屬；ppfPercentage 作為必填參數傳入
- **Files modified:** backend/src/treatments/services/treatment-course.service.ts
- **Verification:** tsc --noEmit 無新錯誤
- **Committed in:** 8fd617e1 (Task 2 commit)

**2. [Rule 1 - Bug] 修正測試模組缺少新依賴**
- **Found during:** Task 2（更新服務依賴）
- **Issue:** treatment-course.service.spec.ts 的測試模組沒有提供新注入的 StaffAssignment repository、TreatmentProgressService、StaffService，導致測試啟動失敗
- **Fix:** 添加三個 mock providers 到 beforeEach 的 TestingModule
- **Files modified:** backend/src/treatments/services/treatment-course.service.spec.ts
- **Verification:** Module providers 對應 service constructor 所有依賴
- **Committed in:** 8fd617e1 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** 適配現有實體結構和修正測試配置，無範圍擴展。

## Issues Encountered

- StaffAssignment 實體的實際欄位與計劃假設不符，需要適配。屬於計劃時的資訊缺口，不影響核心功能設計。

## Next Phase Readiness

- TreatmentProgressService 已就緒，可供其他服務使用
- 醫護人員分配功能完整，支援分配、查詢、取消
- 療程自動完成狀態轉換已實作，後續 API 層可直接調用 completeSession

## Self-Check: PASSED

- backend/src/treatments/services/treatment-progress.service.ts: FOUND
- backend/src/treatments/services/treatment-course.service.ts: FOUND
- .planning/phases/01-treatment-prescription-core/02-SUMMARY.md: FOUND
- commit 19d7b0e6: FOUND
- commit 8fd617e1: FOUND
- commit 93184d6a: FOUND

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-26*
