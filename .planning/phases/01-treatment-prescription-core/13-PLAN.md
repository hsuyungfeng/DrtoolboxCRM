---
phase: 01-treatment-prescription-core
plan: 13
type: execute
wave: 4
depends_on: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12]
files_modified:
  - docs/API.md
  - docs/TESTING.md
  - docs/ARCHITECTURE.md
  - docs/PATIENT_IDENTIFICATION.md
autonomous: true
requirements: [COURSE-01, COURSE-02, COURSE-03, COURSE-04, COURSE-05, SCRIPT-01, SCRIPT-02, SCRIPT-03, PATIENT-01, PATIENT-02, PATIENT-03]
must_haves:
  truths:
    - 所有 API 端點都有文檔
    - 測試策略文檔已建立
    - 系統架構更新
    - 患者身份識別機制文檔化
  artifacts:
    - path: docs/API.md
      provides: API 端點文檔
      contains: "## Treatment Courses"
    - path: docs/TESTING.md
      provides: 測試策略文檔
      contains: "## Unit Tests"

---

<objective>
建立完整的系統文檔，包括 API 文檔、測試策略、架構更新和身份識別機制說明。

**Purpose:**
提供清晰的系統文檔，便於未來維護和擴展。

**Output:**
API 文檔、測試文檔、架構圖、身份識別機制說明。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 文檔內容

1. **API.md** - 所有端點、請求/響應格式、狀態碼
2. **TESTING.md** - 測試策略、覆蓋目標、執行命令
3. **ARCHITECTURE.md** - Phase 1 新增的實體和服務
4. **PATIENT_IDENTIFICATION.md** - 身份證ID + 姓名索引機制

## OpenAPI/Swagger

後端已整合 @nestjs/swagger，可生成自動文檔：
- http://localhost:3000/api/docs （開發時）
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 API 和測試文檔</name>
  <files>
    - docs/API.md
    - docs/TESTING.md
    - docs/PATIENT_IDENTIFICATION.md
  </files>

  <read_first>
    - backend/src/treatments/controllers/medical-order.controller.ts
    - backend/src/treatments/controllers/treatment-course.controller.ts
    - backend/src/patients/controllers/patient.controller.ts
  </read_first>

  <action>
建立完整系統文檔：

**docs/API.md**

```markdown
# API 文檔 - Phase 1

## 治療課程 (Treatment Courses)

### 建立療程
\`\`\`
POST /api/treatments/courses
Content-Type: application/json
Authorization: Bearer {token}

{
  "patientId": "uuid",
  "name": "復健療程",
  "type": "rehabilitation",
  "costPerSession": 1000,
  "totalSessions": 10,
  "description": "一般復健治療"
}

Response (201):
{
  "statusCode": 201,
  "message": "療程已建立",
  "data": {
    "id": "uuid",
    "name": "復健療程",
    "status": "active",
    "progress": {
      "totalSessions": 10,
      "completedSessions": 0,
      "progressPercent": 0
    }
  }
}
\`\`\`

### 取得療程詳情
\`\`\`
GET /api/treatments/courses/{id}
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "復健療程",
    "status": "active",
    "progress": { ... },
    "sessions": [ ... ],
    "staffAssignments": [ ... ]
  }
}
\`\`\`

### 編輯療程
\`\`\`
PATCH /api/treatments/courses/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "更新療程名稱",
  "status": "completed"
}

Response (200):
{
  "statusCode": 200,
  "message": "療程已更新",
  "data": { ... }
}
\`\`\`

### 取得患者療程列表
\`\`\`
GET /api/patients/{patientId}/treatments?status=active
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": [ ... ],
  "count": 5
}
\`\`\`

## 醫令 (Medical Orders)

### 開立醫令
\`\`\`
POST /api/medical-orders
Content-Type: application/json
Authorization: Bearer {token}

{
  "patientId": "uuid",
  "藥物或治療名稱": "感冒藥",
  "劑量": "500mg x 3",
  "使用方式": "口服",
  "療程數": 5,
  "說明": "感冒症狀治療"
}

Response (201):
{
  "statusCode": 201,
  "message": "醫令已開立",
  "data": {
    "id": "uuid",
    "status": "pending",
    "已使用數": 0,
    "療程數": 5
  }
}
\`\`\`

### 記錄醫令使用
\`\`\`
POST /api/medical-orders/{id}/use
Content-Type: application/json
Authorization: Bearer {token}

{
  "usedCount": 2
}

Response (200):
{
  "statusCode": 200,
  "message": "使用進度已記錄",
  "data": {
    "id": "uuid",
    "status": "in_progress",
    "已使用數": 2,
    "療程數": 5
  }
}
\`\`\`

### 取得患者醫令列表
\`\`\`
GET /api/patients/{patientId}/medical-orders?status=pending
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": [ ... ],
  "count": 3
}
\`\`\`

## 患者 (Patients)

### 搜尋患者
\`\`\`
GET /api/patients/search?keyword=John&limit=20
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "John",
      "idNumber": "A123456789",
      "phoneNumber": "0912345678"
    }
  ],
  "count": 1
}
\`\`\`

### 驗證患者身份
\`\`\`
GET /api/patients/identify?idNumber=A123456789&name=John
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "John",
    "idNumber": "A123456789"
  }
}
\`\`\`

### 建立患者
\`\`\`
POST /api/patients
Content-Type: application/json
Authorization: Bearer {token}

{
  "idNumber": "A123456789",
  "name": "John Doe",
  "gender": "male",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "0912345678",
  "email": "john@example.com",
  "address": "123 Main St",
  "medicalHistory": "患者病史",
  "allergies": "過敏：青黴素"
}

Response (201):
{
  "statusCode": 201,
  "message": "患者已建立",
  "data": { ... }
}
\`\`\`

## 錯誤回應

所有錯誤回應遵循以下格式：

\`\`\`json
{
  "statusCode": 400,
  "message": "錯誤訊息",
  "timestamp": "2026-03-26T10:30:00Z",
  "path": "/api/endpoint",
  "errors": [ ... ]
}
\`\`\`

### 常見狀態碼
- 200: 成功
- 201: 已建立
- 400: 錯誤請求（驗證失敗）
- 401: 未認證
- 403: 無權限
- 404: 不存在
- 500: 伺服器錯誤
```

**docs/TESTING.md**

```markdown
# 測試策略 - Phase 1

## 測試架構

| 層級 | 框架 | 覆蓋率目標 | 範圍 |
|-----|------|--------|------|
| 單元 | Jest + ts-jest | 100% | Service 業務邏輯 |
| 集成 | supertest | 90% | Controller 端點 |
| E2E | Playwright | 70% | 完整用戶流程 |

## 執行測試

### 後端測試

\`\`\`bash
# 執行所有測試
npm test

# 執行特定測試
npm test -- medical-order.service.spec.ts

# 生成覆蓋報告
npm test -- --coverage

# 監視模式（開發時）
npm test -- --watch
\`\`\`

### 前端測試

\`\`\`bash
# 執行所有測試
npm run test:unit

# 生成覆蓋報告
npm run test:unit -- --coverage

# 執行 E2E 測試
npm run test:e2e
\`\`\`

## 覆蓋目標

- **後端服務層**：100%
  - CRUD 操作
  - 狀態轉換驗證
  - 業務規則檢查

- **後端控制層**：90%
  - 所有端點覆蓋
  - 異常處理覆蓋
  - 不包括開發時路由列表等

- **前端組件**：80% +
  - 主要組件掛載測試
  - 用戶互動模擬
  - API 調用模擬

- **整體覆蓋率**：90%

## 測試案例示例

### Service 層（醫令建立）

\`\`\`typescript
describe('MedicalOrderService.createMedicalOrder', () => {
  // ✅ 成功路徑：建立有效醫令
  // ✅ 患者不存在：拋出 NotFoundException
  // ✅ 療程數 <= 0：拋出 BadRequestException
  // ✅ 模板複製：使用模板預設值
});
\`\`\`

### Controller 層（醫令端點）

\`\`\`typescript
describe('MedicalOrderController.create', () => {
  // ✅ POST /api/medical-orders 返回 201
  // ✅ 無效 DTO 返回 400 + 驗證錯誤
  // ✅ 未授權請求返回 401
  // ✅ 診所隔離驗證
});
\`\`\`

## 持續集成

- 每次提交時自動運行測試
- 覆蓋率低於 90% 時拒絕提交
- 失敗測試必須修復才能合併

## 調試測試

\`\`\`bash
# 執行單一測試檔案
npm test -- medical-order.service.spec.ts

# 執行特定測試案例
npm test -- -t "should create medical order"

# 顯示詳細輸出
npm test -- --verbose

# 動態偵錯
node --inspect-brk=9229 node_modules/.bin/jest --runInBand
\`\`\`
```

**docs/PATIENT_IDENTIFICATION.md**

```markdown
# 患者身份識別機制 - Phase 1

## 概述

患者在系統中通過兩級標識機制唯一識別：

1. **身份證ID**（idNumber）：主要識別
2. **姓名**（name）：輔助驗證

## 資料庫索引策略

### 複合唯一索引

\`\`\`
UNIQUE INDEX idx_clinic_idnumber ON patients(clinicId, idNumber)
\`\`\`

- **用途**：確保診所內身份證ID唯一
- **性能**：O(1) 查詢時間
- **多租戶隔離**：包含 clinicId

### 複合查詢索引

\`\`\`
INDEX idx_clinic_name ON patients(clinicId, name)
\`\`\`

- **用途**：支持按診所 + 姓名搜尋
- **用例**：患者列表、模糊搜尋

## 查詢流程

### 1. 精確識別（醫護端）

\`\`\`
輸入：身份證ID
查詢：SELECT * FROM patients WHERE clinicId = ? AND idNumber = ?
索引：idx_clinic_idnumber（複合唯一索引）
返回：單個患者或 NULL
\`\`\`

### 2. 雙重驗證（患者自助）

\`\`\`
輸入：身份證ID + 姓名
查詢：SELECT * FROM patients WHERE clinicId = ? AND idNumber = ? AND name = ?
索引：idx_clinic_idnumber（複合唯一索引）
返回：單個患者或 NULL
驗證：防止他人利用已知 ID 查詢
\`\`\`

### 3. 模糊搜尋（醫護端）

\`\`\`
輸入：關鍵字（可能是 ID 或 名字）
查詢：
  SELECT * FROM patients
  WHERE clinicId = ?
  AND (idNumber LIKE ? OR name LIKE ?)
  LIMIT 20
索引：idx_clinic_idnumber + idx_clinic_name
性能：< 100ms（1000+ 患者）
\`\`\`

## API 端點

### 搜尋患者

\`\`\`
GET /api/patients/search?keyword=john&limit=20

Response:
[
  {
    "id": "uuid",
    "idNumber": "A123456789",
    "name": "John Doe",
    "phoneNumber": "0912345678"
  }
]
\`\`\`

### 驗證患者

\`\`\`
GET /api/patients/identify?idNumber=A123456789&name=John

Response:
{
  "id": "uuid",
  "idNumber": "A123456789",
  "name": "John Doe"
}

Error (404): 身份證ID 或 姓名不匹配
\`\`\`

## 安全考慮

1. **唯一性驗證**
   - 建立患者時檢查 idNumber 唯一性
   - 編輯患者時驗證新 ID 唯一性

2. **多租戶隔離**
   - 所有查詢都過濾 clinicId
   - 無法跨診所查詢患者

3. **資料隱私**
   - API 不回傳完整身份證ID（可選）
   - 支持模糊搜尋防止資料外洩

## 性能優化

| 查詢 | 無索引 | 有索引 | 改進 |
|-----|-------|--------|------|
| 精確 ID | 10ms | 0.1ms | 100x |
| 模糊搜尋（1000 患者） | 500ms | 50ms | 10x |
| 分頁列表（Page 50） | 2000ms | 100ms | 20x |

## 未來考慮

1. **全文索引**：支持繁體中文姓名搜尋
2. **模糊匹配**：支持打字錯誤糾正
3. **批量導入**：支持 CSV 匯入患者資料
4. **審計日誌**：記錄所有患者查詢
```

設計：
- 詳細的 API 端點文檔（含範例）
- 明確的測試策略和覆蓋目標
- 患者身份識別機制說明
- 包括性能和安全考慮
  </action>

  <verify>
    - [ ] 檔案存在：test -f docs/API.md
    - [ ] 檔案存在：test -f docs/TESTING.md
    - [ ] 檔案存在：test -f docs/PATIENT_IDENTIFICATION.md
    - [ ] API.md 包含端點文檔：grep -q "POST /api" docs/API.md
    - [ ] TESTING.md 包含測試命令：grep -q "npm test" docs/TESTING.md
  </verify>

  <done>
- API 文檔完成
- 測試文檔完成
- 患者身份識別機制文檔完成
  </done>
</task>

<task type="auto">
  <name>任務 2：更新架構文檔</name>
  <files>docs/ARCHITECTURE.md</files>

  <read_first>
    - .planning/codebase/ARCHITECTURE.md
  </read_first>

  <action>
更新系統架構文檔，記錄 Phase 1 新增內容：

**docs/ARCHITECTURE.md**（補充 Phase 1 部分）

```markdown
## Phase 1：療程與醫令核心

### 新增實體

#### TreatmentCourse
- 療程套餐，包含多個課程
- 狀態機：active → completed/abandoned
- 進度計算：completedSessions / totalSessions

#### TreatmentSession
- 單個課程，屬於某個療程
- 狀態：pending → completed/abandoned
- 支持醫護人員分配

#### MedicalOrder
- 醫令/處方，追蹤藥物或治療的使用
- 狀態機：pending → in_progress → completed/cancelled
- 支持使用進度追蹤（已使用數/療程數）

#### ScriptTemplate
- 醫令模板，快速建立常用醫令
- 預設劑量、使用方式、療程數

#### StaffAssignment
- 醫護人員到課程的分配記錄
- 追蹤誰在何時被分配到哪個課程

### 新增服務

#### TreatmentProgressService
```typescript
calculateProgressPercent(course)    // 計算進度百分比
getProgress(course)                 // 取得詳細進度物件
isCourseFinallyCompleted(course)   // 檢查療程是否全部完成
```

#### MedicalOrderService
```typescript
createMedicalOrder()         // 建立醫令
updateMedicalOrder()         // 編輯醫令（含狀態轉換）
recordMedicalOrderUsage()    // 記錄使用進度
getPatientMedicalOrders()    // 取得患者醫令列表
```

#### PatientSearchService
```typescript
identifyPatientByIdNumber()       // 按身份證ID識別患者
identifyPatientByIdAndName()      // 雙重驗證（ID + 名字）
searchPatients()                   // 關鍵字搜尋
validateIdNumberAvailability()    // 驗證ID唯一性
```

### 新增 API 端點

| 資源 | 端點 | 方法 | 描述 |
|-----|------|------|------|
| 療程 | /api/treatments/courses | POST | 建立療程 |
| 療程 | /api/treatments/courses/:id | GET | 取得詳情 |
| 療程 | /api/treatments/courses/:id | PATCH | 編輯療程 |
| 療程 | /api/treatments/courses/:id/sessions | GET | 課程列表 |
| 患者療程 | /api/patients/:patientId/treatments | GET | 患者療程列表 |
| 醫令 | /api/medical-orders | POST | 開立醫令 |
| 醫令 | /api/medical-orders/:id | GET | 取得詳情 |
| 醫令 | /api/medical-orders/:id | PATCH | 編輯醫令 |
| 醫令 | /api/medical-orders/:id/use | POST | 記錄使用 |
| 患者醫令 | /api/patients/:patientId/medical-orders | GET | 患者醫令列表 |
| 患者 | /api/patients/search | GET | 搜尋患者 |
| 患者 | /api/patients/identify | GET | 雙重驗證 |
| 患者 | /api/patients | POST | 建立患者 |
| 患者 | /api/patients/:id | PATCH | 編輯患者 |

### 多租戶架構強化

所有新增實體都包含 clinicId：

\`\`\`
TreatmentCourse: clinicId + patientId 複合索引
MedicalOrder: clinicId + patientId 複合索引
Patient: (clinicId, idNumber) 複合唯一索引
\`\`\`

### 狀態機設計

**療程狀態**
\`\`\`
active → completed (all sessions done)
active → abandoned (cancelled)
\`\`\`

**醫令狀態**
\`\`\`
pending → in_progress (first usage)
pending → cancelled
in_progress → completed (all used)
in_progress → cancelled
\`\`\`

### 事件驅動架構

TreatmentCourse 實體變更時觸發事件：
- TreatmentCompletedEvent → RevenueCalculationService
- 自動生成收入紀錄和患者積分

### 測試架構

- **Jest**：後端單元/集成測試
- **Vitest**：前端組件測試
- **Playwright**：E2E 用戶流程測試
- **目標覆蓋率**：90% 後端，80% 前端
```

設計：
- 清晰的實體新增說明
- 服務層方法簽名
- API 端點對照表
- 多租戶強化說明
- 狀態機視覺化
  </action>

  <verify>
    - [ ] 檔案存在：test -f docs/ARCHITECTURE.md
    - [ ] 包含 Phase 1 實體：grep -q "TreatmentCourse\|MedicalOrder" docs/ARCHITECTURE.md
    - [ ] 包含 API 端點表：grep -q "|.*POST.*|" docs/ARCHITECTURE.md
  </verify>

  <done>
- 架構文檔更新完成
- Phase 1 實體和服務文檔化
- API 端點對照表完成
  </done>
</task>

</tasks>

<verification>
**文檔驗證：**
- 所有 API 端點都有文檔
- 請求/響應格式清晰
- 測試策略明確
- 患者身份識別機制完整說明

**品質驗證：**
- 文檔語言清楚一致（繁體中文）
- 包含範例代碼
- 包含性能和安全考慮
</verification>

<success_criteria>
- [ ] API.md 完整，包含所有端點
- [ ] TESTING.md 包含測試策略和命令
- [ ] PATIENT_IDENTIFICATION.md 說明索引和查詢策略
- [ ] ARCHITECTURE.md 更新 Phase 1 新增內容
- [ ] 所有文檔都包含在 docs/ 目錄中
- [ ] 文檔使用繁體中文並一致
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/13-SUMMARY.md`

所有文檔已完成，Phase 1 規劃完整。
下一步：執行 Phase 1 實現（/gsd:execute-phase 01）
</output>

