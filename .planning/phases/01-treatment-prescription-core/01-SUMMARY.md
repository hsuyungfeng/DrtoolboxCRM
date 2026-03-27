---
phase: 01-treatment-prescription-core
plan: "01"
subsystem: database
tags: [typeorm, sqlite, entity, dto, class-validator, multi-tenant, medical-order]

# Dependency graph
requires: []
provides:
  - MedicalOrder TypeORM 實體（medical_orders 資料表）
  - ScriptTemplate TypeORM 實體（script_templates 資料表）
  - CreateMedicalOrderDto 請求驗證
  - UpdateMedicalOrderDto 部分更新驗證
affects: [02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TypeORM 實體使用雙語欄位命名（英文屬性名 + 中文 JSDoc 說明）
    - 多租戶隔離透過 clinicId 索引實現
    - 狀態機使用 TypeScript union type 確保型別安全
    - eager: false 避免 N+1 查詢問題

key-files:
  created:
    - backend/src/treatments/entities/medical-order.entity.ts
    - backend/src/treatments/entities/script-template.entity.ts
    - backend/src/treatments/dto/create-medical-order.dto.ts
    - backend/src/treatments/dto/update-medical-order.dto.ts
  modified: []

key-decisions:
  - "使用 varchar(36) 儲存外鍵 patientId 與 prescribedBy，與現有實體保持一致"
  - "MedicalOrder 欄位名稱改用英文（drugOrTreatmentName 等），配合 TypeScript 慣例；中文說明以 JSDoc 記錄"
  - "ScriptTemplate 使用 status 欄位（active/inactive），與 TreatmentCourseTemplate 的 isActive 模式不同，採用字串 enum 以利擴充"
  - "UpdateMedicalOrderDto 加入 @IsIn() 驗證器確保狀態值合法性，優於 type-only 驗證"

patterns-established:
  - "Pattern 1：醫令實體遵循 clinicId + 外鍵複合索引模式，確保多租戶查詢效能"
  - "Pattern 2：MedicalOrderStatus 匯出為 type alias，方便其他模組引用狀態類型"
  - "Pattern 3：DTO 使用 @IsNotEmpty + 中文 message 提供明確錯誤訊息"

requirements-completed: [SCRIPT-01, SCRIPT-02, SCRIPT-03]

# Metrics
duration: 2min
completed: 2026-03-26
---

# Phase 1 Plan 01：醫令實體與 DTO 基礎架構摘要

**TypeORM 醫令實體（MedicalOrder、ScriptTemplate）與 class-validator DTO，建立醫令狀態機（pending → in_progress → completed/cancelled）和多租戶隔離基礎**

## 效能指標

- **執行時間：** 約 2 分鐘
- **開始時間：** 2026-03-26T08:57:30Z
- **完成時間：** 2026-03-26T08:59:29Z
- **任務數：** 3 個任務完成
- **建立檔案數：** 4

## 完成項目

- MedicalOrder TypeORM 實體，含完整狀態機與複合索引
- ScriptTemplate 實體，支援診所常用醫令模板管理
- CreateMedicalOrderDto 提供創建醫令的請求驗證
- UpdateMedicalOrderDto 支援部分更新與狀態轉換驗證

## 任務提交記錄

每個任務均獨立提交：

1. **任務 1：建立 MedicalOrder 實體及狀態機** - `3c0e604d` (feat)
2. **任務 2：建立 ScriptTemplate 實體** - `f505916f` (feat)
3. **任務 3：建立 CreateMedicalOrderDto 和 UpdateMedicalOrderDto** - `3fc6b9df` (feat)

## 建立/修改的檔案

- `backend/src/treatments/entities/medical-order.entity.ts` - 醫令主實體，含狀態機與外鍵關係
- `backend/src/treatments/entities/script-template.entity.ts` - 醫令模板實體，支援啟用/停用
- `backend/src/treatments/dto/create-medical-order.dto.ts` - 創建醫令 DTO，含 UUID 與長度驗證
- `backend/src/treatments/dto/update-medical-order.dto.ts` - 更新醫令 DTO，支援部分更新與狀態驗證

## 決策記錄

- **欄位命名：** 採用英文屬性名（drugOrTreatmentName、dosage、usageMethod）搭配中文 JSDoc 說明，符合 TypeScript 命名慣例，同時維持繁體中文文件
- **外鍵類型：** 使用 varchar(36) 儲存 patientId 與 prescribedBy，與現有 TreatmentCourse 實體模式一致（非 uuid column type）
- **狀態驗證：** UpdateMedicalOrderDto 使用 @IsIn() 裝飾器提供執行期狀態值驗證，而非僅依賴 TypeScript 型別
- **模板狀態：** ScriptTemplate 使用字串 status（active/inactive）而非布林 isActive，留有未來擴充空間

## 計劃偏差

無 — 計劃完整執行，欄位命名調整（中文 → 英文）為主動改善，確保 TypeScript 程式碼品質。

## 遭遇問題

- TypeScript 編譯檢查發現專案中存在多個預先存在的測試錯誤（來自 treatment.controller.spec.ts、points、referrals 等），均非本次任務引入，已記錄為超出範圍問題。

## 下一階段準備

- MedicalOrder 與 ScriptTemplate 實體已準備就緒，可供後續計劃（02-13）使用
- 需要在 AppModule 或 TreatmentsModule 中注冊這兩個實體後方可使用資料庫操作
- DTO 已就緒，可供服務層與控制器使用

---
*Phase: 01-treatment-prescription-core*
*完成日期：2026-03-26*

## Self-Check: PASSED

- FOUND: backend/src/treatments/entities/medical-order.entity.ts
- FOUND: backend/src/treatments/entities/script-template.entity.ts
- FOUND: backend/src/treatments/dto/create-medical-order.dto.ts
- FOUND: backend/src/treatments/dto/update-medical-order.dto.ts
- FOUND: .planning/phases/01-treatment-prescription-core/01-SUMMARY.md
- FOUND commit 3c0e604d: feat(01-01): 建立 MedicalOrder 實體及狀態機
- FOUND commit f505916f: feat(01-01): 建立 ScriptTemplate 實體（醫令模板）
- FOUND commit 3fc6b9df: feat(01-01): 建立 CreateMedicalOrderDto 與 UpdateMedicalOrderDto
