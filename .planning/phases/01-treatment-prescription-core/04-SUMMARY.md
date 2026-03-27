---
phase: 01-treatment-prescription-core
plan: 04
subsystem: api
tags: [nestjs, typeorm, medical-order, crud, state-machine, multi-tenant]

# Dependency graph
requires:
  - phase: 01-treatment-prescription-core/01
    provides: MedicalOrder 實體、CreateMedicalOrderDto、UpdateMedicalOrderDto
  - phase: 01-treatment-prescription-core/02
    provides: TreatmentProgressService 架構模式
  - phase: 01-treatment-prescription-core/03
    provides: Patient 實體（查詢需求）
provides:
  - MedicalOrderService：完整 CRUD 和狀態機管理
  - MedicalOrderController：REST API 端點（POST/GET/PATCH/DELETE）
  - MedicalOrderResponseDto：標準化 API 響應 DTO
affects: [後續需要醫令資料的計劃, TreatmentCourse 整合計劃]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 狀態機模式：validTransitions 物件定義有效狀態轉換
    - 增量使用進度記錄：recordMedicalOrderUsage 支援自動狀態轉換
    - 多租戶隔離：所有查詢強制過濾 clinicId
    - 角色視圖 DTO：使用 @Exclude() 隱藏敏感欄位

key-files:
  created:
    - backend/src/treatments/services/medical-order.service.ts
    - backend/src/treatments/controllers/medical-order.controller.ts
    - backend/src/treatments/dto/medical-order-response.dto.ts
  modified: []

key-decisions:
  - "MedicalOrderController 使用 JwtAuthGuard + ClinicContextGuard 雙重守衛確保認證與多租戶隔離"
  - "clinicId 從 req.user.clinicId 取得（而非 req.clinicId），與現有架構一致"
  - "recordMedicalOrderUsage 採增量更新（每次傳入本次使用次數），而非絕對值更新"
  - "patients/:patientId 路由定義在 :id 之前，避免 Express 路由衝突"

patterns-established:
  - "狀態機模式：private readonly validTransitions 物件清晰定義轉換規則"
  - "計算欄位：progressPercent、remainingCount 作為 DTO 選填欄位，由 Controller 填充"
  - "Logger 注入：所有 Service 方法記錄關鍵操作日誌，包含 orderId、clinicId"

requirements-completed: [SCRIPT-01, SCRIPT-02, SCRIPT-03]

# Metrics
duration: 20min
completed: 2026-03-27
---

# Phase 01 Plan 04：醫令 CRUD API 摘要

**MedicalOrderService 含狀態機（pending→in_progress→completed/cancelled）和 MedicalOrderController REST API，支援增量使用進度追蹤與多租戶隔離**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-27T02:00:00Z
- **Completed:** 2026-03-27T02:20:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- MedicalOrderService 實作完整 CRUD、狀態機轉換、增量使用進度追蹤
- MedicalOrderController 提供 6 個 REST API 端點（POST、GET、PATCH、DELETE、GET patients/:id、POST :id/use）
- MedicalOrderResponseDto 和 MedicalOrderPatientViewDto 支援角色視圖差異化

## Task Commits

各任務均已原子性提交：

1. **任務 1：建立 MedicalOrderService** - `2cf1405d` (feat)
2. **任務 2：建立 MedicalOrderController** - `2cf1405d` (feat)
3. **任務 3：建立 MedicalOrderResponseDto** - `2cf1405d` (feat)

**計劃後設資料：** 待補充 (docs: complete plan)

## Files Created/Modified

- `backend/src/treatments/services/medical-order.service.ts` - 醫令業務邏輯、CRUD、狀態機、增量進度追蹤
- `backend/src/treatments/controllers/medical-order.controller.ts` - REST API 端點、認證守衛、Swagger 文檔
- `backend/src/treatments/dto/medical-order-response.dto.ts` - 醫護人員視圖 DTO 和患者視圖 DTO（含 @Exclude）

## Decisions Made

- **雙重守衛**：使用 `@UseGuards(JwtAuthGuard, ClinicContextGuard)` 確保認證和多租戶隔離同時有效
- **clinicId 來源**：從 `req.user.clinicId` 取得（與 TreatmentCourseController 保持一致），而非從 Guard 的 `req.clinicId`
- **增量進度記錄**：`recordMedicalOrderUsage` 傳入本次新增使用數（增量），非絕對值，減少 race condition 風險
- **路由順序**：`patients/:patientId` 定義在 `:id` 之前，避免 Express 靜態路由被動態路由覆蓋
- **患者視圖 DTO**：使用 class-transformer `@Exclude()` 在序列化層隱藏 prescribedBy 和 clinicId

## Deviations from Plan

None - 計劃如實執行，所有端點和業務邏輯均按規格實作完成。

## Issues Encountered

None - 所有任務順利完成，無阻塞性問題。

## User Setup Required

None - 無需外部服務配置。

## Next Phase Readiness

- 醫令 API 完整可用，可供前端整合
- MedicalOrderService 已可被其他 Service（如 TreatmentCourse）依賴注入
- 狀態機模式已建立，可供後續療程服務參考

## Self-Check: PASSED

- [x] `backend/src/treatments/services/medical-order.service.ts` - 存在且包含 createMedicalOrder、validTransitions、recordMedicalOrderUsage
- [x] `backend/src/treatments/controllers/medical-order.controller.ts` - 存在且包含 @Post()、@Get(':id')、@Patch、@Delete、@UseGuards
- [x] `backend/src/treatments/dto/medical-order-response.dto.ts` - 存在且包含 MedicalOrderResponseDto、MedicalOrderPatientViewDto
- [x] 提交 `2cf1405d` 存在於 git 歷史中

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-27*
