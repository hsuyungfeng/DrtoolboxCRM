# Doctor CRM ↔ Doctor Toolbox API 整合文件

**版本：** 1.0
**最後更新：** 2026-03-31
**狀態：** 生產就緒

---

## 概述

Doctor CRM 與 Doctor Toolbox 系統透過 Webhook 實現雙向患者資料同步。本文件描述整合 API 的規格、端點、錯誤處理及資料映射。

### 主要特性

- **即時同步：** Webhook 推送模型，Doctor Toolbox 發起患者變更事件
- **自動衝突解決：** 同一患者在兩系統發生衝突時自動合併（CRM 為權威來源）
- **可靠傳遞：** 指數退避重試機制（最多 5 次嘗試）
- **稽核追蹤：** 所有同步事件記錄到稽核日誌，可查詢追蹤

---

## Webhook 端點

### 接收 Doctor Toolbox 事件

**端點：** `POST /sync/webhook`

**認證：** HMAC-SHA256 簽名驗證

#### 請求頭

```
x-signature: sha256=<HMAC-SHA256(body, secret)>
x-timestamp: <Unix timestamp in seconds>
Content-Type: application/json
```

時間戳必須在當前時間 ±5 分鐘內，防止重放攻擊。

#### 請求本體

```json
{
  "webhookId": "webhook-123e4567-e89b-12d3-a456-426614174000",
  "patientId": "toolbox-patient-999",
  "action": "patient_created",
  "timestamp": 1711881600,
  "patient": {
    "id": "toolbox-patient-999",
    "idNumber": "A123456789",
    "name": "王小明",
    "phone": "0912345678",
    "email": "wang@example.com",
    "dateOfBirth": "1990-01-01",
    "gender": "M",
    "address": "台北市中山區"
  }
}
```

#### 請求欄位說明

| 欄位 | 型別 | 說明 |
|------|------|------|
| `webhookId` | string | Webhook 唯一識別碼（用於冪等性） |
| `patientId` | string | Doctor Toolbox 患者 ID |
| `action` | enum | 事件類型：`patient_created`, `patient_updated`, `patient_deleted` |
| `timestamp` | number | Unix 時間戳（秒） |
| `patient` | object | 患者資料物件 |
| `patient.id` | string | Toolbox 患者 ID |
| `patient.idNumber` | string | 身份證號碼（唯讀，不可變） |
| `patient.name` | string | 患者姓名 |
| `patient.phone` | string | 電話號碼 |
| `patient.email` | string | 電子郵件 |

#### 成功回應 (200)

```json
{
  "statusCode": 200,
  "message": "Patient synced successfully",
  "data": {
    "patientId": "crm-patient-uuid",
    "syncStatus": "synced",
    "conflictDetected": false
  }
}
```

#### 衝突回應 (409)

```json
{
  "statusCode": 409,
  "message": "Conflict detected, auto-merged with CRM authority",
  "data": {
    "patientId": "crm-patient-uuid",
    "syncStatus": "conflict",
    "mergedFields": ["name", "phone"]
  }
}
```

#### 錯誤回應

| 狀態碼 | 錯誤碼 | 說明 |
|--------|--------|------|
| 400 | `INVALID_PAYLOAD` | 請求本體格式錯誤或缺少必要欄位 |
| 401 | `INVALID_SIGNATURE` | HMAC 簽名驗證失敗 |
| 401 | `INVALID_TIMESTAMP` | 時間戳超出 ±5 分鐘範圍 |
| 409 | `CONFLICT_DETECTED` | 患者資料衝突，已自動合併 |
| 503 | `SERVICE_UNAVAILABLE` | 同步服務暫時無法使用，應重試 |

---

## 患者查詢 API（內部使用）

### 精確查詢患者

**端點：** `GET /api/patients/identify`

**查詢參數：**

```
GET /api/patients/identify?idNumber=A123456789&name=王小明
```

| 參數 | 型別 | 說明 |
|------|------|------|
| `idNumber` | string | 身份證號碼（優先） |
| `name` | string | 患者姓名 |
| `phone` | string | 電話號碼（備用） |

**回應：**

```json
{
  "statusCode": 200,
  "data": {
    "id": "crm-patient-uuid",
    "idNumber": "A123456789",
    "name": "王小明",
    "phone": "0912345678",
    "email": "wang@example.com"
  }
}
```

---

## 稽核日誌 API

### 查詢患者同步日誌

**端點：** `GET /sync/audit/logs/:patientId`

**認證：** Bearer Token (JWT)

**回應：**

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "audit-1",
      "clinicId": "clinic-1",
      "patientId": "patient-1",
      "action": "webhook-received",
      "source": "toolbox",
      "status": "success",
      "eventData": {
        "webhookId": "webhook-123"
      },
      "timestamp": "2026-03-31T10:30:00Z"
    }
  ],
  "count": 1
}
```

### 查詢診所同步日誌

**端點：** `GET /sync/audit/clinic`

**查詢參數：**

```
GET /sync/audit/clinic?limit=500&startDate=2026-03-01&endDate=2026-03-31
```

### 查詢同步統計

**端點：** `GET /sync/audit/stats`

**回應：**

```json
{
  "statusCode": 200,
  "data": {
    "stats": {
      "totalSyncs": 500,
      "successful": 485,
      "failed": 15,
      "avgSyncTime": 1200
    },
    "failureAlert": {
      "hasAlert": false,
      "failureCount": 2
    }
  }
}
```

### 查詢重試模式

**端點：** `GET /sync/audit/retry-patterns`

**回應：**

```json
{
  "statusCode": 200,
  "data": {
    "avgRetriesPerSync": 0.25,
    "successRateAfterRetry": 0.95
  }
}
```

---

## 資料映射

### Doctor Toolbox → CRM

Toolbox 發起的患者更新僅同步以下欄位：

```json
{
  "idNumber": "A123456789",     // 唯讀，核心身份
  "name": "王小明",              // 可更新
  "phone": "0912345678",         // 可更新
  "email": "wang@example.com"    // 可更新
}
```

**醫療資料（不同步）：** 治療記錄、療程筆記、醫療歷史僅保存於 CRM

### CRM → Toolbox（未來支援）

目前版本不支援 CRM 回推至 Toolbox。未來版本將支援以下欄位同步：

```json
{
  "name": "患者姓名",
  "phone": "電話",
  "email": "電子郵件"
}
```

---

## 錯誤代碼參考

### 400 Bad Request

| 錯誤 | 原因 |
|-----|------|
| `INVALID_PAYLOAD` | 缺少必要欄位或型別錯誤 |
| `VALIDATION_ERROR` | 資料驗證失敗（如無效身份證格式） |
| `INVALID_ACTION` | action 欄位值無效 |

### 401 Unauthorized

| 錯誤 | 原因 |
|-----|------|
| `INVALID_SIGNATURE` | HMAC-SHA256 簽名不匹配 |
| `INVALID_TIMESTAMP` | 時間戳已過期或時間差異過大 |

### 409 Conflict

患者在 CRM 和 Toolbox 中資料不一致時發生。系統自動使用 CRM 為權威來源進行合併。

### 503 Service Unavailable

同步服務暫時無法使用，Client 應實現指數退避重試。

---

## 重試策略

失敗的 Webhook 會按以下計畫重試：

| 嘗試 | 延遲 | 累計時間 |
|------|------|---------|
| 1 | 0s | 0s |
| 2 | 2s | 2s |
| 3 | 4s | 6s |
| 4 | 8s | 14s |
| 5 | 16s | 30s |

**公式：** `delay = 2^(attempt-1) 秒`

超過 5 次嘗試後放棄，記錄失敗至稽核日誌。

---

## 測試 Webhook

### 使用 curl 驗證簽名

```bash
#!/bin/bash
SECRET="your-webhook-secret"
PAYLOAD='{"webhookId":"test-123","patientId":"pat-1","action":"patient_created","timestamp":'$(date +%s)',"patient":{"id":"pat-1","idNumber":"A123456789","name":"測試患者","phone":"0912345678","email":"test@example.com"}}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -r | awk '{print $1}')
TIMESTAMP=$(date +%s)

curl -X POST http://localhost:3000/sync/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: sha256=$SIGNATURE" \
  -H "x-timestamp: $TIMESTAMP" \
  -d "$PAYLOAD"
```

### 預期回應

```json
{
  "statusCode": 200,
  "message": "Patient synced successfully",
  "data": {
    "patientId": "crm-patient-uuid",
    "syncStatus": "synced"
  }
}
```

---

## 環境變數

```bash
# Doctor Toolbox Webhook 密鑰（用於簽名驗證）
DOCTOR_TOOLBOX_WEBHOOK_SECRET=your-secret-key

# Doctor Toolbox API 基礎 URL
DOCTOR_TOOLBOX_API_URL=https://toolbox-api.example.com

# Webhook 时间戳窗口（秒）
WEBHOOK_TIMESTAMP_WINDOW=300
```

---

## 支援

如遇整合問題，請參考 `docs/INTEGRATION_GUIDE.md` 或檢查稽核日誌：

```bash
GET /sync/audit/clinic
```

---

**End of API Documentation**
