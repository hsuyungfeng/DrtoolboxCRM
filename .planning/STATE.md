---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-27T11:34:26.106Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 17
  completed_plans: 16
---

# 項目狀態：Doctor CRM

**更新時間：** 2026-03-27
**當前階段：** Phase 2 執行中
**里程碑：** v1.0 - 自費醫療管理系統
**當前計劃：** Phase 02 / Plan 02（已完成）— 通知持久化實體與核心服務重構完成

## 項目參考

見：.planning/PROJECT.md（更新於 2026-03-26）

**核心價值：** 為醫療機構提供統一的自費診療管理平台，含療程管理、費用追蹤、患者通知

---

## 進度總覽

| 元素 | 狀態 | 進度 |
|------|------|------|
| 專案初始化 | ✓ 完成 | 100% |
| 代碼庫分析 | ✓ 完成 | 100% |
| 需求定義 | ✓ 完成 | 100% |
| 路線圖規劃 | ✓ 完成 | 100% |
| **Phase 1** | ✓ 完成 | 100% (13/13 計劃完成) |
| **Phase 2** | 執行中 | 67% (2/3 計劃完成) |
| Phase 3 | ○ 待處理 | 0% |
| Phase 4 | ○ 待處理 | 0% |

---

## Phase 1 計劃進度

| 計劃 | 名稱 | 狀態 | 提交 |
|------|------|------|------|
| 01 | MedicalOrder 實體與 DTO | ✓ 完成 | 3fc6b9df |
| 02 | TreatmentProgressService + 醫護分配 | ✓ 完成 | 93184d6a |
| 03 | PatientSearch 實體與搜尋服務 | ✓ 完成 | 20143af4 |
| 04 | MedicalOrderController 醫令 API | ✓ 完成 | 2cf1405d |
| 05 | TreatmentCourse CRUD API | ✓ 完成 | 9eeb169d |
| 06 | PatientController 患者 API | ✓ 完成 | 98dd91d4 |
| 07 | DTO 驗證層與 ValidationErrorFilter | ✓ 完成 | 00b37172 |
| 08 | Frontend 療程管理 UI 組件 | ✓ 完成 | 7e0a8f5a |
| 09 | Frontend 醫令管理 UI 組件 | ✓ 完成 | 5151fa85 |
| 10 | 患者儀表板 PatientDashboard | ✓ 完成 | 7e5b246b |
| 11 | 後端單元與集成測試 | ✓ 完成 | 84d10e23 |
| 12 | 前端 Vue 組件與 API 單元測試 | ✓ 完成 | 227e6c53 |
| 13 | 系統文檔建立 | ✓ 完成 | 89157c0d |

---

## 決策記錄

- **2026-03-26 [01-01]：** MedicalOrder 欄位採用英文屬性名（drugOrTreatmentName、dosage、usageMethod），中文說明以 JSDoc 記錄
- **2026-03-26 [01-01]：** ScriptTemplate 使用字串 status（active/inactive）而非布林 isActive，預留擴充空間
- **2026-03-26 [01-01]：** UpdateMedicalOrderDto 使用 @IsIn() 提供執行期狀態值驗證
- **2026-03-26 [01-03]：** Patient 實體採用複合唯一索引 (clinicId, idNumber) 確保診所內身份唯一
- **2026-03-26 [01-03]：** PatientSearchRepository 繼承 TypeORM Repository 以利用複合索引查詢
- **2026-03-26 [01-03]：** 保留既有欄位（emergencyContact、currentMedications 等）確保向後相容性
- **2026-03-26 [01-02]：** 進度計算從 sessions.completionStatus 即時衍生，不單獨儲存進度欄位以保持資料一致性
- **2026-03-26 [01-02]：** StaffAssignment 使用現有 staffRole/ppfPercentage 欄位；clinicId 驗證透過 session.clinicId 完成
- **2026-03-26 [01-02]：** StaffModule 匯入 TreatmentsModule 以使用 StaffService 驗證醫護人員存在和診所歸屬
- **2026-03-26 [01-07]：** ValidationErrorFilter 優先於 HttpExceptionFilter 註冊，確保驗證錯誤以標準格式回應
- **2026-03-26 [01-07]：** VALIDATION_RULES 使用中文鍵名，與系統既有中文 JSDoc 文件風格一致
- **2026-03-26 [01-07]：** patient-validators.ts 作為轉接模組重新匯出 dto-validators.ts，保持單一來源
- **2026-03-27 [01-04]：** MedicalOrderController 使用 JwtAuthGuard + ClinicContextGuard 雙重守衛，clinicId 從 req.user.clinicId 取得
- **2026-03-27 [01-04]：** recordMedicalOrderUsage 採增量更新（每次傳入本次使用次數），而非絕對值更新
- **2026-03-27 [01-04]：** patients/:patientId 路由定義在 :id 之前，避免 Express 路由衝突
- **2026-03-27 [01-05]：** TreatmentCourseController 使用 JwtAuthGuard 而非 ClinicContextGuard，與現有架構一致
- **2026-03-27 [01-05]：** clinicId 透過 query 參數或 req.user.clinicId 雙重解析，提高 API 彈性
- **2026-03-27 [01-05]：** 患者視圖 DTO 使用 @Exclude() 在序列化層隱藏敏感欄位（clinicId、patientId）
- **2026-03-27 [01-08]：** TreatmentProgressBar 使用 withDefaults + computed 修正計劃範本 props 存取 bug
- **2026-03-27 [01-08]：** 課程完成後 checkbox disabled，確保療程進度資料單向遞增
- **2026-03-27 [01-08]：** treatmentsApi.completeSession 使用 PATCH /treatments/sessions/:id/complete
- **2026-03-27 [01-09]：** MedicalOrderTable 以 render function 內嵌於 MedicalOrderList.vue，避免獨立組件額外建立
- **2026-03-27 [01-09]：** medical-orders-api.ts 欄位使用英文屬性名與後端 DTO 一致（drugOrTreatmentName、dosage、usageMethod、totalUsage）
- **2026-03-27 [01-10]：** PatientTreatmentView 使用 treatmentsApi.getTreatments({ patientId }) 符合現有 API 服務層結構
- **2026-03-27 [01-10]：** PatientMedicalOrderView 模板欄位名更正為英文（drugOrTreatmentName 等），與 MedicalOrder 介面一致
- **2026-03-27 [01-10]：** 患者視圖組件採唯讀設計，無新增/編輯/刪除操作
- **2026-03-27 [01-11]：** PatientController 集成測試使用 MockClinicContextGuard 模擬認證，不依賴真實 JWT
- **2026-03-27 [01-11]：** Jest coverageThreshold 設定 branches 70%、functions/lines/statements 90%，排除 entity/module/dto/main.ts
- **2026-03-27 [01-13]：** API 文檔端點路徑不含 `/api` 前綴，基礎 URL 已在文件頂部說明（符合 OpenAPI 規範慣例）
- **2026-03-27 [01-13]：** 架構文檔服務方法簽名採 TypeScript 格式，確保文檔可作為介面參考
- **2026-03-27 [01-13.1]：** markSessionComplete 使用 PATCH sessions/:id/complete，內部組合 DTO 呼叫 sessionService.completeSession
- **2026-03-27 [01-13.1]：** Controller 測試 mock 需包含控制器實際呼叫的所有 service 方法（getCourseWithProgress 非 getCourseById）
- **2026-03-27 [02-01]：** CourseStartedEvent 在事務外 emit，CourseCompletedEvent 在事務內 emit（EventEmitter2 async 模式確保 Listener 在提交後執行）
- **2026-03-27 [02-01]：** tests/ 目錄的 spec 補入 EventEmitter2 mock，避免 DI 容器初始化失敗（Rule 3 自動修正）
- **2026-03-27 [02-02]：** NotificationRecord 記錄每次發送嘗試（含 channel），支援多渠道分別追蹤，偏好缺席預設全渠道啟用
- **2026-03-27 [02-02]：** in_app 渠道 status 設為 sent（儲存即送達），email/sms 設為 pending（等待 Plan 03）
- **2026-03-27 [02-02]：** NotificationService 移至 services/ 子目錄，controller import 同步更新（Rule 3）

---

## 計劃文件位置

| 文件 | 用途 |
|------|------|
| `.planning/PROJECT.md` | 項目願景與背景 |
| `.planning/REQUIREMENTS.md` | 功能需求清單 |
| `.planning/ROADMAP.md` | 分階段發展計劃 |
| `.planning/config.json` | 工作流配置 |
| `.planning/codebase/` | 現有代碼庫分析（7 份文件） |

---

## Phase 2 計劃進度

| 計劃 | 名稱 | 狀態 | 提交 |
|------|------|------|------|
| 01 | 事件基礎架構（course.started / course.completed） | ✓ 完成 | d6a88d0a |
| 02 | 通知持久化實體與核心服務重構 | ✓ 完成 | 4ad994cc |
| 03 | 通知管理 API | ○ 待處理 | — |

---

## 最後會話

**停止於：** Completed 02-02-PLAN.md（2026-03-27T11:33:23Z）

**下一步：** 執行 Phase 2 Plan 03（通知管理 API）

---

*最後更新：2026-03-27T11:33:23Z*
