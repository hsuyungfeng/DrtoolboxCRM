# API 文檔 - Phase 1

> 版本：1.0
> 更新日期：2026-03-27
> 基礎 URL：`http://localhost:3000/api`
> Swagger UI：`http://localhost:3000/api/docs`

---

## 認證

所有 API 端點（除 `/auth/login` 和 `/health`）均需 JWT Bearer Token：

```
Authorization: Bearer {token}
```

Clinic 上下文透過 HTTP Header 傳遞：

```
X-Clinic-Id: {clinicId}
```

---

## 治療課程（Treatment Courses）

### 建立療程

```
POST /treatments/courses
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
```

### 取得療程詳情

```
GET /treatments/courses/{id}
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "復健療程",
    "status": "active",
    "progress": {
      "totalSessions": 10,
      "completedSessions": 3,
      "progressPercent": 30
    },
    "sessions": [
      {
        "id": "uuid",
        "sessionNumber": 1,
        "completionStatus": "completed",
        "completedAt": "2026-03-20T10:00:00Z"
      }
    ],
    "staffAssignments": [
      {
        "staffId": "uuid",
        "staffName": "Dr. Chen",
        "assignedAt": "2026-03-20T09:00:00Z"
      }
    ]
  }
}
```

### 編輯療程

```
PATCH /treatments/courses/{id}
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
  "data": {
    "id": "uuid",
    "name": "更新療程名稱",
    "status": "completed"
  }
}
```

### 取得療程課程列表

```
GET /treatments/courses/{id}/sessions
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "sessionNumber": 1,
      "completionStatus": "completed",
      "completedAt": "2026-03-20T10:00:00Z"
    }
  ],
  "count": 10
}
```

### 取得患者療程列表

```
GET /patients/{patientId}/treatments?status=active
Authorization: Bearer {token}

Query 參數：
  - status: active | completed | abandoned（可選）
  - page: 頁碼（預設 1）
  - limit: 每頁筆數（預設 20）

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "復健療程",
      "status": "active",
      "progress": {
        "totalSessions": 10,
        "completedSessions": 5,
        "progressPercent": 50
      }
    }
  ],
  "count": 5
}
```

---

## 醫令（Medical Orders）

### 開立醫令

```
POST /medical-orders
Content-Type: application/json
Authorization: Bearer {token}

{
  "patientId": "uuid",
  "drugOrTreatmentName": "感冒藥",
  "dosage": "500mg x 3",
  "usageMethod": "口服",
  "totalUsage": 5,
  "notes": "感冒症狀治療"
}

Response (201):
{
  "statusCode": 201,
  "message": "醫令已開立",
  "data": {
    "id": "uuid",
    "drugOrTreatmentName": "感冒藥",
    "status": "pending",
    "usedCount": 0,
    "totalUsage": 5
  }
}
```

### 取得醫令詳情

```
GET /medical-orders/{id}
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "drugOrTreatmentName": "感冒藥",
    "dosage": "500mg x 3",
    "usageMethod": "口服",
    "status": "in_progress",
    "usedCount": 2,
    "totalUsage": 5,
    "createdAt": "2026-03-20T10:00:00Z"
  }
}
```

### 編輯醫令

```
PATCH /medical-orders/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "notes": "更新備註",
  "status": "cancelled"
}

Response (200):
{
  "statusCode": 200,
  "message": "醫令已更新",
  "data": {
    "id": "uuid",
    "status": "cancelled"
  }
}
```

### 記錄醫令使用

```
POST /medical-orders/{id}/use
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
    "usedCount": 2,
    "totalUsage": 5
  }
}
```

### 取得患者醫令列表

```
GET /patients/{patientId}/medical-orders?status=pending
Authorization: Bearer {token}

Query 參數：
  - status: pending | in_progress | completed | cancelled（可選）
  - page: 頁碼（預設 1）
  - limit: 每頁筆數（預設 20）

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "drugOrTreatmentName": "感冒藥",
      "status": "pending",
      "usedCount": 0,
      "totalUsage": 5
    }
  ],
  "count": 3
}
```

---

## 患者（Patients）

### 建立患者

```
POST /patients
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
  "data": {
    "id": "uuid",
    "idNumber": "A123456789",
    "name": "John Doe",
    "gender": "male",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "0912345678"
  }
}
```

### 取得患者詳情

```
GET /patients/{id}
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "idNumber": "A123456789",
    "name": "John Doe",
    "gender": "male",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "0912345678",
    "email": "john@example.com",
    "address": "123 Main St",
    "medicalHistory": "患者病史",
    "allergies": "過敏：青黴素",
    "createdAt": "2026-03-01T09:00:00Z"
  }
}
```

### 編輯患者

```
PATCH /patients/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "phoneNumber": "0987654321",
  "address": "456 New St"
}

Response (200):
{
  "statusCode": 200,
  "message": "患者已更新",
  "data": { ... }
}
```

### 搜尋患者

```
GET /patients/search?keyword=John&limit=20
Authorization: Bearer {token}

Query 參數：
  - keyword: 搜尋關鍵字（身份證ID 或 姓名）
  - limit: 最大筆數（預設 20，最大 50）

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "idNumber": "A123456789",
      "phoneNumber": "0912345678"
    }
  ],
  "count": 1
}
```

### 驗證患者身份

```
GET /patients/identify?idNumber=A123456789&name=John
Authorization: Bearer {token}

Query 參數：
  - idNumber: 身份證ID（必填）
  - name: 患者姓名（必填）

Response (200):
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "idNumber": "A123456789"
  }
}

Response (404) - 不匹配：
{
  "statusCode": 404,
  "message": "患者身份驗證失敗",
  "timestamp": "2026-03-27T06:00:00Z",
  "path": "/api/patients/identify"
}
```

---

## 錯誤回應

所有錯誤回應遵循以下格式：

```json
{
  "statusCode": 400,
  "message": "錯誤訊息",
  "timestamp": "2026-03-26T10:30:00Z",
  "path": "/api/endpoint",
  "errors": [
    {
      "field": "idNumber",
      "message": "身份證ID格式不正確"
    }
  ]
}
```

### 常見狀態碼

| 狀態碼 | 說明 |
|-------|------|
| 200 | 成功 |
| 201 | 已建立 |
| 400 | 錯誤請求（驗證失敗） |
| 401 | 未認證 |
| 403 | 無權限 |
| 404 | 資源不存在 |
| 409 | 資源衝突（如重複身份證ID）|
| 500 | 伺服器內部錯誤 |

---

## 狀態碼定義

### 療程狀態（TreatmentCourse.status）

| 值 | 說明 |
|----|------|
| `active` | 進行中 |
| `completed` | 已完成 |
| `abandoned` | 已放棄 |

### 醫令狀態（MedicalOrder.status）

| 值 | 說明 |
|----|------|
| `pending` | 待執行 |
| `in_progress` | 執行中 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |

---

*API 文檔版本：1.0 | Phase 1 完成於 2026-03-27*
