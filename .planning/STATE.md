# 項目狀態：Doctor CRM

**更新時間：** 2026-03-27
**當前階段：** Phase 1 執行中
**里程碑：** v1.0 - 自費醫療管理系統
**當前計劃：** Phase 01 / Plan 05（已完成）→ 進行 Plan 08

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
| **Phase 1** | ◆ 進行中 | 62% (8/13 計劃完成) |
| Phase 2 | ○ 待處理 | 0% |
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
| 08-13 | 後續計劃 | ○ 待處理 | - |

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
- **2026-03-27 [01-05]：** TreatmentCourseController 使用 JwtAuthGuard 而非 ClinicContextGuard，與現有架構一致
- **2026-03-27 [01-05]：** clinicId 透過 query 參數或 req.user.clinicId 雙重解析，提高 API 彈性
- **2026-03-27 [01-05]：** 患者視圖 DTO 使用 @Exclude() 在序列化層隱藏敏感欄位（clinicId、patientId）

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

## 最後會話

**停止於：** Phase 01 Plan 05 完成（2026-03-27T00:00:00Z）

**下一步：** 執行 Phase 1 Plan 08

---

*最後更新：2026-03-27*
