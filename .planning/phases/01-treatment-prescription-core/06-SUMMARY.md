---
phase: 01-treatment-prescription-core
plan: "06"
subsystem: patients-api
tags: [patients, api, rest, multi-tenant, search, identity-verification]
dependency_graph:
  requires: [03]
  provides: [patients-crud-api, patient-search-api, patient-identity-verification]
  affects: [frontend-patient-pages, appointment-api]
tech_stack:
  added: []
  patterns: [multi-tenant-guard, clinicId-isolation, id-uniqueness-validation]
key_files:
  created: []
  modified:
    - backend/src/patients/controllers/patient.controller.ts
    - backend/src/patients/services/patient.service.ts
    - backend/src/patients/patients.module.ts
    - backend/src/common/guards/clinic-context.guard.ts
    - backend/src/patients/dto/create-patient.dto.ts
decisions:
  - PatientController 使用 api/patients 路由前綴，符合 RESTful 標準
  - req.clinicId 由 ClinicContextGuard 注入，不依賴請求體避免安全風險
  - createPatient/updatePatient 分離 clinicId 參數確保多租戶強隔離
  - 保留舊有 create/update 方法向後相容，標記為 @deprecated
metrics:
  duration: "2m 4s"
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 01 Plan 06：患者 API 端點 Summary

**一句話摘要：** 實現患者 RESTful API（搜尋、雙重驗證、CRUD）含多租戶 clinicId 隔離與身份證ID唯一性驗證。

---

## 完成任務

| 任務 | 名稱 | 提交 | 關鍵檔案 |
|------|------|------|----------|
| 1 | 建立 PatientController | 496858c4 | controllers/patient.controller.ts, patients.module.ts |
| 2 | 增強 PatientService CRUD | 98dd91d4 | services/patient.service.ts |

---

## 實現內容

### PatientController（`api/patients`）

| 端點 | 方法 | 說明 |
|------|------|------|
| GET `/api/patients/search?keyword=xxx` | PatientSearchService.searchPatients | 模糊搜尋身份證ID或姓名 |
| GET `/api/patients/identify?idNumber=xxx&name=xxx` | PatientSearchService.identifyPatientByIdAndName | 雙重驗證身份 |
| GET `/api/patients/:id` | PatientSearchService.getPatientProfile | 患者詳情含療程 |
| POST `/api/patients` | PatientService.createPatient | 建立患者含唯一性驗證 |
| PATCH `/api/patients/:id` | PatientService.updatePatient | 更新患者資料 |
| GET `/api/patients` | PatientSearchService.getClinicPatients | 分頁列舉患者 |

### PatientService 新增方法

- **createPatient(dto, clinicId)：** 建立患者前驗證身份證ID唯一性，強制注入 clinicId 防止請求體竄改
- **updatePatient(id, dto, clinicId)：** 多租戶隔離查詢 + 若更換身份證ID則重新驗證唯一性

---

## 決策記錄

1. **req.clinicId 由 Guard 注入：** ClinicContextGuard 設置 `request.clinicId` 屬性，控制器從 `req.clinicId` 取得，避免直接依賴 headers
2. **clinicId 不從請求體取得：** createPatient/updatePatient 的 `clinicId` 參數來自 Guard，不使用 DTO 中的值，防止多租戶竄改
3. **保留向後相容方法：** 舊的 create/findAll/findOne/update/remove 保留但標記 @deprecated

---

## 偏差記錄

### 自動修正問題

**1. [Rule 2 - 缺少關鍵功能] ClinicContextGuard 未設置 req.clinicId**
- **發現於：** 任務 1 實現過程
- **問題：** 計劃中控制器使用 `req.clinicId`，但 ClinicContextGuard 只設置 header，沒有設置 request 屬性
- **修正：** 在 guard 中加入 `request.clinicId = userClinicId`，super_admin 可存取指定診所
- **修改檔案：** `backend/src/common/guards/clinic-context.guard.ts`
- **提交：** 496858c4

**2. [Rule 2 - 缺少資料完整性] CreatePatientDto 缺少必填 idNumber 欄位**
- **發現於：** 任務 1 實現過程
- **問題：** Patient 實體有 `idNumber` 必填欄位且有唯一索引，但 CreatePatientDto 缺少此欄位
- **修正：** 在 DTO 中加入 `@IsString() @Length(1, 50) idNumber: string`
- **修改檔案：** `backend/src/patients/dto/create-patient.dto.ts`
- **提交：** 496858c4

---

## Self-Check
