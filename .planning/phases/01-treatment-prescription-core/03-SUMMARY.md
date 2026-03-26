---
phase: 01-treatment-prescription-core
plan: 03
subsystem: patients
tags: [patient-identity, search, composite-index, multi-tenant, repository-pattern]
dependency_graph:
  requires: []
  provides: [patient-entity-enhanced, patient-search-repository, patient-search-service]
  affects: [treatment-course, appointments, prescriptions]
tech_stack:
  added: []
  patterns: [composite-index, repository-pattern, service-layer, multi-tenant-isolation]
key_files:
  created:
    - backend/src/patients/repositories/patient-search.repository.ts
    - backend/src/patients/services/patient-search.service.ts
  modified:
    - backend/src/patients/entities/patient.entity.ts
decisions:
  - Kept existing patient fields (emergencyContact, currentMedications, pointsBalance, referredBy) while adding new ones
  - Used string type for gender/status fields to maintain backward compatibility with existing data
  - Added phoneNumber column alongside preserving existing column names for API stability
  - queryByIdNumber method name used in repository (matches plan artifact requirement)
metrics:
  duration: 126s
  completed: 2026-03-26
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 1
---

# Phase 1 Plan 03: Patient Identity and Search Summary

## 一句話摘要

增強患者實體含複合唯一索引 (clinicId, idNumber)，建立 PatientSearchRepository（精確+模糊搜尋）和 PatientSearchService（身份識別+雙重驗證+分頁）。

## 完成任務

| 任務 | 說明 | Commit | 檔案 |
|------|------|--------|------|
| 1 | 增強 Patient 實體 - 複合索引與欄位 | aeeab0af | patient.entity.ts |
| 2 | 建立 PatientSearchRepository | 00cba255 | patient-search.repository.ts |
| 3 | 建立 PatientSearchService | 20143af4 | patient-search.service.ts |

## 實作細節

### Patient 實體增強（Task 1）

增強了 `backend/src/patients/entities/patient.entity.ts`：

**新增索引：**
- `@Index(["clinicId", "idNumber"], { unique: true })` - 複合唯一索引，確保診所內身份證ID唯一
- `@Index(["clinicId", "name"])` - 複合索引，支持診所+姓名搜尋
- `@Index(["clinicId"])` - 單一索引，支持診所過濾

**新增欄位：**
- `medicalHistory` - 病史（text）
- `notes` - 醫護備註（text）
- `phoneNumber` - 電話號碼（varchar 20）

**更新關係：**
- `@OneToMany(() => TreatmentCourse)` - 替換舊的 Treatment 關係為 TreatmentCourse

**保留既有欄位：**
- `emergencyContact`, `emergencyPhone`, `currentMedications`, `pointsBalance`, `referredBy`, `referrerType`, `assignedDoctorId`

### PatientSearchRepository（Task 2）

建立 `backend/src/patients/repositories/patient-search.repository.ts`：

| 方法 | 說明 | 索引使用 |
|------|------|---------|
| `findByIdNumberAndClinic` | 精確查詢（身份+診所） | 複合唯一索引 |
| `findByIdNumberNameAndClinic` | 雙重驗證查詢 | 複合唯一索引 |
| `searchByName` | 姓名模糊搜尋 | 複合名字索引 |
| `queryByIdNumber` | 身份證ID模糊搜尋 | 診所索引 |
| `searchPatients` | 綜合關鍵字搜尋 | 診所索引 |
| `findByClinic` | 診所患者分頁列表 | 診所索引 |
| `existsByIdNumber` | 唯一性驗證 | 複合唯一索引 |
| `getPatientWithTreatments` | 患者+療程完整資料 | 主鍵 |

### PatientSearchService（Task 3）

建立 `backend/src/patients/services/patient-search.service.ts`：

| 方法 | 說明 |
|------|------|
| `identifyPatientByIdNumber` | 主要患者識別（丟出 NotFoundException） |
| `identifyPatientByIdAndName` | 雙重驗證識別（高安全場景） |
| `searchPatients` | 關鍵字搜尋（含輸入驗證） |
| `getClinicPatients` | 分頁患者列表 |
| `validateIdNumberAvailability` | 身份證ID可用性驗證 |
| `getPatientProfile` | 完整患者資料含療程 |
| `getPublicPatientInfo` | 公開資訊（隱藏敏感欄位） |
| `findByIdNumberAndName` | 快捷雙重查詢方法 |

## 偏離計劃

### 自動修復問題

None - 計劃按原定執行。

### 保留既有欄位

計劃規格新增了一些欄位（如 medicalHistory、notes、phoneNumber），但原有實體已存在相關欄位（如 medicalNotes、phone）。

**處理方式：** 保留所有既有欄位以維持向後相容，同時新增計劃要求的欄位。這確保現有 API 不會中斷。

## 驗證結果

**身份識別驗證：**
- 複合唯一索引 (clinicId, idNumber) 確保患者在診所內唯一
- findByIdNumberAndClinic 使用此索引精確識別患者
- findByIdNumberNameAndClinic 支持身份證ID + 姓名雙重驗證

**搜尋性能驗證：**
- 複合索引支持高效 (clinicId, name) 和 (clinicId, idNumber) 查詢
- findByClinic 支持分頁以提高大量患者時的性能
- searchPatients 模糊搜尋使用 LIKE 查詢配合索引

**多租戶隔離驗證：**
- 所有 Repository 查詢都過濾 clinicId
- 複合唯一索引包含 clinicId 確保診所間隔離

## 下一步建議

1. 在 PatientsModule 中注冊 PatientSearchRepository 和 PatientSearchService
2. 更新 PatientsController 以使用 PatientSearchService 的新方法
3. 考慮為患者 API 添加 DTO 驗證（身份證ID 格式、電話格式）
4. 考慮數據庫遷移腳本以添加新的複合索引到現有數據庫

## Self-Check: PASSED

- backend/src/patients/entities/patient.entity.ts: FOUND
- backend/src/patients/repositories/patient-search.repository.ts: FOUND
- backend/src/patients/services/patient-search.service.ts: FOUND
- Commit aeeab0af: FOUND
- Commit 00cba255: FOUND
- Commit 20143af4: FOUND
