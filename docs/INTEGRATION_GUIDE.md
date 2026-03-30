# Doctor Toolbox 整合安裝指南

**版本：** 1.0
**最後更新：** 2026-03-31
**適用系統：** Doctor CRM v1.0+

---

## 目錄

1. [前置條件](#前置條件)
2. [環境設定](#環境設定)
3. [步驟 1：註冊 Webhook](#步驟-1註冊-webhook)
4. [步驟 2：設定環境變數](#步驟-2設定環境變數)
5. [步驟 3：初始化診所資料遷移](#步驟-3初始化診所資料遷移)
6. [步驟 4：驗證同步](#步驟-4驗證同步)
7. [除錯指南](#除錯指南)
8. [常見問題](#常見問題)

---

## 前置條件

在開始整合前，請確保：

- **Doctor CRM 版本：** ≥ 1.0.0
- **Node.js 版本：** ≥ 18.0
- **PostgreSQL 版本：** ≥ 12.0
- **Doctor Toolbox 管理員帳戶：** 具備 API 存取權限
- **HTTPS URL：** Doctor CRM 部署在公開 HTTPS URL（如 `https://your-crm.com`）

### 驗證系統狀態

```bash
# 檢查 Doctor CRM 後端服務
curl https://your-crm.com/api/health

# 預期回應
{
  "status": "ok",
  "timestamp": "2026-03-31T10:30:00Z"
}
```

---

## 環境設定

### 後端環境變數

編輯 `.env.production` 或設定系統環境變數：

```bash
# Doctor Toolbox Webhook 密鑰（從 Toolbox 管理介面複製）
DOCTOR_TOOLBOX_WEBHOOK_SECRET=sk-toolbox-xxxxxxxxxxxxxxxxxxxx

# Doctor Toolbox API 端點
DOCTOR_TOOLBOX_API_URL=https://api.doctor-toolbox.com

# Webhook 時間戳驗證窗口（秒）
WEBHOOK_TIMESTAMP_WINDOW=300

# 診所 ID（用於遷移和查詢）
CLINIC_ID=clinic-001
```

---

## 步驟 1：註冊 Webhook

### 在 Doctor Toolbox 管理介面

1. 登入 Doctor Toolbox 管理後臺
2. 導航至 **設定 > API 整合 > Webhook**
3. 點擊 **新增 Webhook**
4. 填寫以下資訊：

| 欄位 | 值 |
|------|-----|
| **Webhook URL** | `https://your-crm.com/sync/webhook` |
| **事件類型** | 選擇以下項目：<br> - `patient_created` <br> - `patient_updated` <br> - `patient_deleted` |
| **主動傳送密鑰** | 複製系統產生的密鑰 |
| **重試次數** | 5 |
| **重試間隔** | 自動（指數退避） |

5. 點擊 **測試連線** 驗證連線
6. 保存 Webhook 設定

### 預期測試回應

```json
{
  "statusCode": 200,
  "message": "Webhook test successful"
}
```

---

## 步驟 2：設定環境變數

### 2.1 從 Doctor Toolbox 複製密鑰

在 Webhook 管理介面，複製生成的 **Webhook 密鑰**（格式：`sk-toolbox-...`）

### 2.2 更新後端環境設定

```bash
# 編輯 .env.production
export DOCTOR_TOOLBOX_WEBHOOK_SECRET="sk-toolbox-xxxxxxxxxxxxxxxxxxxx"
export DOCTOR_TOOLBOX_API_URL="https://api.doctor-toolbox.com"
```

### 2.3 重啟後端服務

```bash
cd backend
npm run build
npm run start:prod
```

### 2.4 驗證環境變數已載入

```bash
# 檢查設定日誌
tail -f logs/application.log | grep "DOCTOR_TOOLBOX"

# 預期輸出
[INFO] DOCTOR_TOOLBOX_API_URL configured: https://api.doctor-toolbox.com
[INFO] DOCTOR_TOOLBOX_WEBHOOK_SECRET configured: sk-toolbox-***
```

---

## 步驟 3：初始化診所資料遷移

首次連接時，Doctor CRM 需要從 Doctor Toolbox 匯入所有既有患者。

### 3.1 觸發遷移

```bash
curl -X POST https://your-crm.com/migrate/clinic-001 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**回應（立即返回）：**

```json
{
  "clinicId": "clinic-001",
  "totalPatients": 1250,
  "processedPatients": 0,
  "failedCount": 0,
  "status": "in-progress",
  "percentage": 0,
  "estimatedSecondsRemaining": 2100,
  "startedAt": "2026-03-31T10:30:00Z"
}
```

### 3.2 監控遷移進度

```bash
# 每 5 秒查詢一次進度
watch -n 5 'curl -s https://your-crm.com/migrate/clinic-001/progress \
  -H "Authorization: Bearer $JWT_TOKEN" | jq ".data"'
```

**進度範例：**

```json
{
  "clinicId": "clinic-001",
  "totalPatients": 1250,
  "processedPatients": 550,
  "failedCount": 3,
  "status": "in-progress",
  "percentage": 44,
  "estimatedSecondsRemaining": 850
}
```

### 3.3 遷移完成

當 `percentage` 達到 100% 且 `status` 為 `completed`：

```json
{
  "clinicId": "clinic-001",
  "totalPatients": 1250,
  "processedPatients": 1247,
  "failedCount": 3,
  "status": "completed",
  "percentage": 100,
  "estimatedSecondsRemaining": 0,
  "completedAt": "2026-03-31T10:45:00Z"
}
```

### 3.4 恢復失敗的遷移

若遷移中斷，可恢復：

```bash
curl -X POST https://your-crm.com/migrate/clinic-001/resume \
  -H "Authorization: Bearer $JWT_TOKEN"
```

系統會從上次停止的位置繼續處理。

---

## 步驟 4：驗證同步

### 4.1 查詢診所同步日誌

```bash
curl https://your-crm.com/sync/audit/clinic \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json"
```

**回應：**

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "audit-1",
      "clinicId": "clinic-001",
      "patientId": "patient-123",
      "action": "webhook-received",
      "source": "toolbox",
      "status": "success",
      "timestamp": "2026-03-31T10:30:00Z"
    },
    {
      "id": "audit-2",
      "clinicId": "clinic-001",
      "patientId": "patient-123",
      "action": "sync-success",
      "source": "toolbox",
      "status": "success",
      "timestamp": "2026-03-31T10:30:01Z"
    }
  ],
  "count": 2
}
```

### 4.2 檢查同步統計

```bash
curl https://your-crm.com/sync/audit/stats \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**回應：**

```json
{
  "statusCode": 200,
  "data": {
    "stats": {
      "totalSyncs": 1250,
      "successful": 1247,
      "failed": 3,
      "avgSyncTime": 960
    },
    "failureAlert": {
      "hasAlert": false,
      "failureCount": 0
    }
  }
}
```

### 4.3 測試 Webhook 簽名驗證

```bash
#!/bin/bash
CLINIC_ID="clinic-001"
SECRET="$DOCTOR_TOOLBOX_WEBHOOK_SECRET"
PAYLOAD=$(cat <<EOF
{
  "webhookId": "test-webhook-$(date +%s)",
  "patientId": "test-patient",
  "action": "patient_created",
  "timestamp": $(date +%s),
  "patient": {
    "id": "test-patient",
    "idNumber": "T123456789",
    "name": "測試患者",
    "phone": "0987654321",
    "email": "test@example.com"
  }
}
EOF
)

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -r | awk '{print $1}')
TIMESTAMP=$(date +%s)

curl -X POST https://your-crm.com/sync/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: sha256=$SIGNATURE" \
  -H "x-timestamp: $TIMESTAMP" \
  -d "$PAYLOAD" \
  | jq .
```

**預期成功回應：**

```json
{
  "statusCode": 200,
  "message": "Patient synced successfully"
}
```

---

## 除錯指南

### 常見問題排查

#### 1. Webhook 簽名驗證失敗

**症狀：** 收到 401 Unauthorized

**原因：**
- HMAC 密鑰不匹配
- 時間戳窗口設置過小

**解決方案：**
```bash
# 檢查環境變數
echo $DOCTOR_TOOLBOX_WEBHOOK_SECRET

# 驗證時間戳窗口
export WEBHOOK_TIMESTAMP_WINDOW=600  # 增加到 10 分鐘

# 檢查伺服器時間同步
ntpstat
```

#### 2. 遷移卡住（進度未更新）

**症狀：** 遷移進度停留在某個百分比

**原因：**
- API 連線超時（批次大小過大）
- 資料庫效能問題
- 患者資料格式錯誤

**解決方案：**
```bash
# 中止遷移
curl -X DELETE https://your-crm.com/migrate/clinic-001 \
  -H "Authorization: Bearer $JWT_TOKEN"

# 檢查日誌
tail -100 logs/application.log | grep "migration"

# 重新開始遷移
curl -X POST https://your-crm.com/migrate/clinic-001 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 3. 患者同步失敗

**症狀：** 部分患者同步失敗，`failed` 計數增加

**原因：**
- 身份證號碼格式不一致
- 患者資料衝突無法自動解決

**解決方案：**
```bash
# 查詢失敗患者
curl "https://your-crm.com/sync/audit/clinic?limit=100" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.data[] | select(.status=="failed")'

# 檢查錯誤訊息
jq '.eventData.errorMessage' audit-logs.json
```

---

## 常見問題

### Q1. 為什麼某些患者無法同步？

**A：** Doctor CRM 使用 **身份證號碼 + 姓名** 作為患者唯一識別。若兩系統中身份證號碼或姓名不一致，會標記為衝突，由 CRM 進行自動合併（CRM 為權威來源）。檢查稽核日誌確認衝突詳情。

### Q2. 初始遷移需要多久？

**A：** 平均每患者 ~1 秒。1000 個患者約 16 分鐘，包括批次處理和重試。可於 `/migrate/:clinicId/progress` 查詢即時進度。

### Q3. 遷移失敗能否恢復？

**A：** 可以。調用 `POST /migrate/:clinicId/resume` 自動從上次停止位置繼續，無需重新開始。

### Q4. 同步延遲通常是多少？

**A：** Webhook 到完全同步通常 < 1 秒。若失敗則觸發重試，最多延遲 30 秒（5 次重試）。

### Q5. 醫療資料會同步嗎？

**A：** 否。僅同步患者基本資料（身份證、姓名、電話、電郵）。治療記錄、療程筆記等醫療資料僅保存於 CRM，不傳送至 Toolbox。

### Q6. 如何檢查同步狀態？

**A：** 使用稽核 API：
- `GET /sync/audit/clinic` — 所有同步事件
- `GET /sync/audit/stats` — 統計摘要
- `GET /sync/audit/logs/:patientId` — 特定患者日誌

---

## 支援

整合遇到問題？

1. 檢查本指南的除錯部分
2. 查詢稽核日誌：`GET /sync/audit/clinic`
3. 聯絡技術支援，並提供：
   - 遷移進度（`GET /migrate/:clinicId/progress`）
   - 失敗患者列表（稽核日誌篩選 `status=failed`）
   - 後端應用日誌（最近 100 行）

---

**整合指南結束**
**文件版本：1.0** | **更新於 2026-03-31**
