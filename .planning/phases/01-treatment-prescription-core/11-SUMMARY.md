---
phase: 01-treatment-prescription-core
plan: 11
subsystem: backend-tests
tags: [testing, jest, unit-tests, integration-tests, coverage]
dependency_graph:
  requires: [01, 02, 03, 04, 05, 06]
  provides: [test-coverage, regression-protection]
  affects: [backend-quality]
tech_stack:
  added: []
  patterns: [jest-mock-repository, supertest-integration, guard-override]
key_files:
  created:
    - backend/src/treatments/tests/medical-order.service.spec.ts
    - backend/src/treatments/tests/treatment-course.service.spec.ts
    - backend/src/patients/tests/patient.controller.spec.ts
  modified:
    - backend/package.json
decisions:
  - "PatientController 集成測試使用 MockClinicContextGuard 覆蓋 CanActivate 介面，模擬認證環境而不依賴真實 JWT"
  - "supertest import 使用 require() 代替 import * as，解決 ESM/CJS 模組互操作問題"
  - "Jest coverageThreshold 設定 branches 70%（因受 Guard/Filter 等難測分支影響）、functions/lines/statements 90%"
  - "coverage 排除 entity、module、dto、main.ts 等自動生成或宣告型檔案"
metrics:
  duration_seconds: 248
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 1 Plan 11: 後端單元與集成測試 Summary

**一行摘要：** 為 MedicalOrderService、TreatmentCourseService、PatientController 建立 67 個單元/集成測試，並配置 Jest 覆蓋率閾值（90%目標）

## 完成任務

### 任務 1：MedicalOrderService 和 TreatmentCourseService 單元測試

**提交：** 7d25d6f2

**新增檔案：**
- `backend/src/treatments/tests/medical-order.service.spec.ts` — 29 個測試
- `backend/src/treatments/tests/treatment-course.service.spec.ts` — 29 個測試

**測試覆蓋範圍：**

MedicalOrderService（29 個測試）：
- `createMedicalOrder`：成功建立、患者不存在、療程數 <= 0、模板複製、模板不存在
- `getMedicalOrder`：成功查詢、不存在異常
- `updateMedicalOrder`：狀態轉換 pending→in_progress、in_progress→completed、無效轉換、已使用數超限、欄位更新
- `getPatientMedicalOrders`：成功查詢、狀態過濾、空結果
- `cancelMedicalOrder`：pending/in_progress 取消成功、completed/cancelled 無法取消
- `recordMedicalOrderUsage`：首次使用自動轉 in_progress、全部完成轉 completed、超出剩餘數異常、終態不可更新
- `getProgressPercent`：正確百分比計算、邊界值（0%、100%、除以零）

TreatmentCourseService（29 個測試）：
- `createCourse`：事務建立、點數抵扣計算、超額點數異常、模板不存在、缺少必填欄位
- `getCourseById`：成功查詢含 sessions、不存在異常、空 ID 異常
- `getPatientCourses`：列舉、空結果、狀態過濾、缺少 patientId 異常
- `updateCourse`：名稱更新、不存在異常、completed 狀態設定 completedAt、無效狀態異常
- `deleteCourse`：未開始可刪除、已開始不可刪除、不存在異常
- `completeSession`：成功完成、全部完成自動更新課程狀態、不存在異常
- `assignStaffToSession`：成功分配、重複分配異常、不同診所醫護異常、療程不存在異常
- `getCourseWithProgress`：回傳含進度物件、不存在異常

### 任務 2：PatientController 集成測試和覆蓋報告配置

**提交：** 84d10e23

**新增檔案：**
- `backend/src/patients/tests/patient.controller.spec.ts` — 9 個 HTTP 集成測試

**修改檔案：**
- `backend/package.json` — 更新 Jest 覆蓋配置

**PatientController 測試覆蓋（9 個測試）：**
- `GET /api/patients/search`：回傳結果、無關鍵字、預設 limit 20
- `GET /api/patients/identify`：身份驗證回傳
- `GET /api/patients/:id`：患者詳情、clinicId 傳遞驗證
- `POST /api/patients`：建立成功 201、clinicId 傳遞驗證
- `PATCH /api/patients/:id`：更新成功 200
- `GET /api/patients`：分頁列表、pagination 結構驗證

**Jest 覆蓋配置更新：**
```json
"collectCoverageFrom": [
  "**/*.(t|j)s",
  "!**/*.entity.ts",
  "!**/*.module.ts",
  "!**/dto/*.ts",
  "!**/main.ts"
],
"coverageThreshold": {
  "global": {
    "branches": 70,
    "functions": 90,
    "lines": 90,
    "statements": 90
  }
}
```

## 測試結果摘要

| 測試套件 | 測試數 | 狀態 |
|---------|------|------|
| medical-order.service.spec.ts（新增） | 29 | 全部通過 |
| treatment-course.service.spec.ts（新增） | 29 | 全部通過 |
| patient.controller.spec.ts（新增） | 9 | 全部通過 |
| **本計劃新增合計** | **67** | **全部通過** |
| 全套件（含既有） | 470 | 466 通過（4 個既有失敗） |

## 已知問題（既有失敗，非本計劃範疇）

`treatment.controller.spec.ts` 中 4 個測試因 `getCourseWithProgress` 未在 mock 中定義而失敗。此問題在本計劃執行前已存在，記錄於 `deferred-items.md`。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] supertest import 方式修正**
- **發現於：** 任務 2 執行中
- **問題：** `import * as request from 'supertest'` 在 ts-jest + Jest 30 環境下不能作為函式呼叫
- **修復：** 改用 `const request = require('supertest')` 相容 CommonJS
- **修改檔案：** backend/src/patients/tests/patient.controller.spec.ts
- **提交：** 84d10e23

### 計劃調整

計劃範本中 `CreateMedicalOrderDto` 使用中文欄位名（`藥物或治療名稱`、`劑量`等），與實際實作使用英文欄位名（`drugOrTreatmentName`、`dosage`等）不符。測試按實際實作調整，不影響測試邏輯。

## Self-Check: PASSED

| 項目 | 狀態 |
|-----|------|
| medical-order.service.spec.ts 存在 | FOUND |
| treatment-course.service.spec.ts 存在 | FOUND |
| patient.controller.spec.ts 存在 | FOUND |
| commit 7d25d6f2 存在 | FOUND |
| commit 84d10e23 存在 | FOUND |
| coverageThreshold 在 package.json | FOUND |
