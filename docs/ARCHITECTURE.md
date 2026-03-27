# 系統架構文檔

> 版本：1.0
> 更新日期：2026-03-27
> 涵蓋範圍：Phase 1 — 療程與醫令核心

---

## 系統概覽

Doctor CRM 是一個多租戶自費醫療管理平台，採用模組化 NestJS 後端搭配 Vue 3 前端。

**核心設計原則：**
- 診所隔離（每個診所資料完全分離）
- 領域驅動設計（DDD）分層架構
- 事件驅動解耦跨模組通訊

---

## 技術棧

| 層次 | 技術 |
|-----|------|
| 後端框架 | NestJS + TypeScript |
| ORM | TypeORM |
| 資料庫 | SQLite（開發）/ PostgreSQL（生產）|
| API 文檔 | @nestjs/swagger（Swagger UI）|
| 認證 | JWT（passport-jwt）|
| 前端框架 | Vue 3 + Composition API |
| 前端 UI | Naive UI |
| 前端狀態 | Pinia |
| HTTP 客戶端 | Axios |
| 後端測試 | Jest + ts-jest + supertest |
| 前端測試 | Vitest + Vue Test Utils |

---

## 架構層次

```
┌─────────────────────────────────────────────────┐
│                  前端（Vue 3）                   │
│   Views → Components → Services → Pinia Stores  │
└─────────────────┬───────────────────────────────┘
                  │ HTTP (REST API)
                  │ Authorization: Bearer {jwt}
                  │ X-Clinic-Id: {clinicId}
┌─────────────────▼───────────────────────────────┐
│              後端（NestJS）                       │
│   Controllers → Services → Repositories → DB    │
│                                                  │
│   Middleware: ClinicAuthMiddleware               │
│   Guards: JwtAuthGuard, ClinicContextGuard       │
│   Filters: HttpExceptionFilter, ValidationFilter │
└─────────────────────────────────────────────────┘
```

---

## 多租戶架構

### 請求流程

1. 前端 axios 攔截器自動添加 `X-Clinic-Id` header
2. `ClinicAuthMiddleware` 從 header/query/body 提取 `clinicId`
3. `ClinicContextGuard` 驗證 JWT 並確認診所存取權限
4. 所有 Service 查詢自動過濾 `clinicId`

### 資料隔離保證

所有核心實體均包含 `clinicId` 欄位，查詢時強制過濾。

---

## Phase 1：療程與醫令核心

### 新增實體

#### TreatmentCourse（療程）

```typescript
@Entity('treatment_courses')
@Index(['clinicId', 'patientId'])
export class TreatmentCourse {
  id: string;
  clinicId: string;
  patientId: string;
  name: string;
  type: string;
  status: 'active' | 'completed' | 'abandoned';
  costPerSession: number;
  totalSessions: number;
  description: string;
  sessions: TreatmentSession[];
}
```

**用途：** 療程套餐，包含多個課程
**狀態機：** `active → completed / abandoned`
**進度計算：** `completedSessions / totalSessions`（即時衍生，不儲存）

#### TreatmentSession（課程）

```typescript
@Entity('treatment_sessions')
export class TreatmentSession {
  id: string;
  courseId: string;
  clinicId: string;
  sessionNumber: number;
  completionStatus: 'pending' | 'completed' | 'abandoned';
  completedAt: Date;
  staffAssignments: StaffAssignment[];
}
```

**用途：** 單個課程，屬於某個療程
**狀態：** `pending → completed / abandoned`

#### MedicalOrder（醫令）

```typescript
@Entity('medical_orders')
@Index(['clinicId', 'patientId'])
export class MedicalOrder {
  id: string;
  clinicId: string;
  patientId: string;
  drugOrTreatmentName: string;
  dosage: string;
  usageMethod: string;
  totalUsage: number;
  usedCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}
```

**用途：** 醫令/處方，追蹤藥物或治療的使用進度
**狀態機：** `pending → in_progress → completed / cancelled`

#### ScriptTemplate（醫令模板）

```typescript
@Entity('script_templates')
export class ScriptTemplate {
  id: string;
  clinicId: string;
  name: string;
  drugOrTreatmentName: string;
  dosage: string;
  usageMethod: string;
  totalUsage: number;
  status: 'active' | 'inactive';
}
```

**用途：** 預設醫令模板，快速建立常用醫令

#### StaffAssignment（醫護人員分配）

```typescript
@Entity('staff_assignments')
export class StaffAssignment {
  id: string;
  sessionId: string;
  staffId: string;
  clinicId: string;
  staffRole: string;
  ppfPercentage: number;
  assignedAt: Date;
}
```

**用途：** 記錄醫護人員分配到課程的記錄，支援 PPF 收入計算

#### Patient（患者 — 強化）

```typescript
@Entity('patients')
@Index(['clinicId', 'idNumber'], { unique: true })  // 身份證唯一索引
@Index(['clinicId', 'name'])                          // 姓名搜尋索引
export class Patient {
  id: string;
  clinicId: string;
  idNumber: string;  // 診所內唯一
  name: string;
  gender: string;
  dateOfBirth: Date;
  phoneNumber: string;
  email: string;
  address: string;
  medicalHistory: string;
  allergies: string;
}
```

**Phase 1 強化：** 新增複合唯一索引，支援身份識別機制

---

### 新增服務

#### TreatmentProgressService

```typescript
class TreatmentProgressService {
  calculateProgressPercent(course: TreatmentCourse): number
  getProgress(course: TreatmentCourse): TreatmentProgressDto
  isCourseFinallyCompleted(course: TreatmentCourse): boolean
}
```

**職責：** 從 sessions 即時計算療程進度，不儲存進度欄位

#### MedicalOrderService

```typescript
class MedicalOrderService {
  createMedicalOrder(dto: CreateMedicalOrderDto, clinicId: string): Promise<MedicalOrder>
  updateMedicalOrder(id: string, dto: UpdateMedicalOrderDto, clinicId: string): Promise<MedicalOrder>
  recordMedicalOrderUsage(id: string, usedCount: number, clinicId: string): Promise<MedicalOrder>
  getPatientMedicalOrders(patientId: string, clinicId: string, status?: string): Promise<MedicalOrder[]>
}
```

**職責：** 醫令 CRUD 及使用進度追蹤

#### PatientSearchService

```typescript
class PatientSearchService {
  identifyPatientByIdNumber(idNumber: string, clinicId: string): Promise<Patient>
  identifyPatientByIdAndName(idNumber: string, name: string, clinicId: string): Promise<Patient>
  searchPatients(keyword: string, clinicId: string, limit: number): Promise<Patient[]>
  validateIdNumberAvailability(idNumber: string, clinicId: string, excludeId?: string): Promise<void>
}
```

**職責：** 患者搜尋、身份識別與唯一性驗證

---

### 新增 API 端點

| 資源 | 端點 | 方法 | 描述 |
|-----|------|------|------|
| 療程 | `/api/treatments/courses` | POST | 建立療程 |
| 療程 | `/api/treatments/courses/:id` | GET | 取得詳情 |
| 療程 | `/api/treatments/courses/:id` | PATCH | 編輯療程 |
| 療程 | `/api/treatments/courses/:id/sessions` | GET | 課程列表 |
| 患者療程 | `/api/patients/:patientId/treatments` | GET | 患者療程列表 |
| 醫令 | `/api/medical-orders` | POST | 開立醫令 |
| 醫令 | `/api/medical-orders/:id` | GET | 取得詳情 |
| 醫令 | `/api/medical-orders/:id` | PATCH | 編輯醫令 |
| 醫令 | `/api/medical-orders/:id/use` | POST | 記錄使用 |
| 患者醫令 | `/api/patients/:patientId/medical-orders` | GET | 患者醫令列表 |
| 患者 | `/api/patients/search` | GET | 搜尋患者 |
| 患者 | `/api/patients/identify` | GET | 雙重驗證 |
| 患者 | `/api/patients` | POST | 建立患者 |
| 患者 | `/api/patients/:id` | PATCH | 編輯患者 |

---

### 多租戶架構強化

Phase 1 所有新增實體均包含 `clinicId`：

```
TreatmentCourse:  (clinicId, patientId) 複合索引
MedicalOrder:     (clinicId, patientId) 複合索引
Patient:          (clinicId, idNumber)  複合唯一索引
StaffAssignment:  clinicId 欄位（通過 session.clinicId 驗證）
```

---

### 狀態機設計

#### 療程狀態（TreatmentCourse.status）

```
         所有課程完成
active ──────────────────► completed
  │
  │  人工放棄
  └────────────────────────► abandoned
```

#### 醫令狀態（MedicalOrder.status）

```
           第一次記錄使用
pending ───────────────────► in_progress ────► completed（全部使用完畢）
  │                              │
  │                              │ 人工取消
  └──── 人工取消 ────────────────┴───────────► cancelled
```

---

### 事件驅動架構

Phase 1 新增的事件流程：

```
TreatmentCourse（完成）
        │
        │ EventEmitter.emit('treatment.completed')
        ▼
TreatmentCompletedEvent
        │
        ├──► RevenueCalculationService（收入計算）
        │         └─► RevenueRecord（建立收入記錄）
        │
        └──► PointsService（積分更新）
                  └─► PointsTransaction（積分交易記錄）
```

---

### 測試架構

| 層級 | 框架 | 職責 |
|-----|------|------|
| 後端單元 | Jest + ts-jest | Service 業務邏輯 |
| 後端集成 | Jest + supertest | Controller HTTP 端點 |
| 前端單元 | Vitest | Vue 組件 |
| E2E | Playwright | 完整用戶流程 |

**覆蓋率目標：** 後端 90%（branches 70%）、前端 80%+

---

## 資料庫結構

### 現有表（Phase 0）

- `clinics` — 診所主資料
- `users` — 用戶帳號
- `patients` — 患者（Phase 1 強化索引）
- `treatment_sessions` — 課程（既有）
- `staff` — 醫護人員

### Phase 1 新增表

- `treatment_courses` — 療程套餐
- `medical_orders` — 醫令
- `script_templates` — 醫令模板
- `staff_assignments` — 醫護分配記錄

---

## 安全架構

### 認證

- **機制：** JWT（RS256 或 HS256）
- **Token 位置：** `Authorization: Bearer {token}` header
- **有效期：** 8 小時（可配置）

### 授權

- **多租戶隔離：** `ClinicContextGuard` 驗證 `user.clinicId === request.clinicId`
- **角色權限：** 超級管理員（`super_admin`）可跨診所操作
- **資源隔離：** 所有 Service 查詢強制包含 `clinicId` 條件

### 輸入驗證

- **框架：** `class-validator` + `class-transformer`
- **全域：** `ValidationErrorFilter` 統一格式化驗證錯誤
- **DTO：** 每個端點都有對應 DTO 進行輸入驗證

---

## 錯誤處理架構

```typescript
// 統一錯誤響應格式
{
  statusCode: number;
  message: string;
  timestamp: string;    // ISO 8601
  path: string;
  errorCode?: string;   // 業務錯誤碼
  errors?: Array<{      // 驗證錯誤詳情
    field: string;
    message: string;
  }>;
}
```

### 異常過濾器優先級

1. `ValidationErrorFilter` — 處理驗證失敗（400）
2. `HttpExceptionFilter` — 處理 HTTP 異常
3. `AllExceptionsFilter` — 捕獲所有未處理異常（500）

---

## 部署架構

### 開發環境

```bash
# 後端
cd backend && npm run start:dev   # Port 3000

# 前端
cd frontend && npm run dev        # Port 5173

# Swagger UI
http://localhost:3000/api/docs
```

### 環境變數

```env
# 後端
DB_TYPE=sqlite|postgres
DB_PATH=./database.sqlite
JWT_SECRET=your-secret
PORT=3000

# 生產資料庫
DB_HOST=localhost
DB_PORT=5432
DB_NAME=doctor_crm
DB_USER=postgres
DB_PASS=password
```

---

*架構文檔版本：1.0 | Phase 1 完成於 2026-03-27*
