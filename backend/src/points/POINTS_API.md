# Points 點數系統 API 文檔

## 概述

Points 系統是 Doctor CRM 的重要組件，用於管理客戶（患者和員工）的點數獎勵和兌換。

## 核心特性

- **自動重試機制**：針對樂觀鎖衝突自動重試（最多 3 次，指數退避）
- **樂觀鎖控制**：PointsBalance 使用版本列防止並發更新衝突
- **精確計算**：所有點數計算支持小數點精度
- **多租戶支持**：完全隔離不同診所的點數數據
- **完整審計**：所有交易都有記錄，支持完整的交易歷史查詢

## API 端點

### 1. 獎勵點數

**端點**: `POST /points/award`

**描述**: 為客戶獎勵點數（例如推薦獎勵、療程完成獎勵等）

**請求參數**:
```json
{
  "customerId": "patient-001",              // 必填：客戶 ID
  "customerType": "patient",                // 必填：客戶類型 ('patient' | 'staff')
  "type": "earn_referral",                  // 必填：交易類型
  "amount": 100,                            // 必填：獎勵點數（正數）
  "source": "referral",                     // 必填：來源 ('referral' | 'treatment' | 'manual')
  "clinicId": "clinic-001",                 // 必填：診所 ID
  "referralId": "referral-123"              // 可選：關聯的推薦記錄 ID
}
```

**返回範例**:
```json
{
  "id": "tx-001",
  "customerId": "patient-001",
  "customerType": "patient",
  "type": "earn_referral",
  "amount": 100,
  "balance": 600,                    // 交易後的餘額
  "source": "referral",
  "clinicId": "clinic-001",
  "referralId": "referral-123",
  "createdAt": "2026-02-12T10:30:00Z",
  "updatedAt": "2026-02-12T10:30:00Z"
}
```

**HTTP 狀態碼**:
- `201 Created`: 成功獎勵點數
- `400 Bad Request`: 點數必須大於 0
- `409 Conflict`: 樂觀鎖衝突超過重試次數（非常罕見）
- `404 Not Found`: 客戶不存在

---

### 2. 兌換點數

**端點**: `POST /points/redeem`

**描述**: 客戶兌換點數（用於療程折扣或其他消費）

**請求參數**:
```json
{
  "customerId": "patient-001",              // 必填：客戶 ID
  "customerType": "patient",                // 必填：客戶類型
  "amount": 50,                             // 必填：兌換點數（正數）
  "clinicId": "clinic-001",                 // 必填：診所 ID
  "treatmentId": "treat-123"                // 可選：關聯的療程 ID
}
```

**返回範例**:
```json
{
  "id": "tx-002",
  "customerId": "patient-001",
  "customerType": "patient",
  "type": "redeem",
  "amount": -50,                     // 負數表示扣減
  "balance": 550,                    // 交易後的餘額
  "source": "treatment",
  "clinicId": "clinic-001",
  "treatmentId": "treat-123",
  "createdAt": "2026-02-12T10:35:00Z",
  "updatedAt": "2026-02-12T10:35:00Z"
}
```

**HTTP 狀態碼**:
- `201 Created`: 成功兌換點數
- `400 Bad Request`: 點數不足或兌換金額無效
- `409 Conflict`: 樂觀鎖衝突超過重試次數
- `404 Not Found`: 客戶的點數餘額不存在

---

### 3. 取得點數餘額

**端點**: `GET /points/balance`

**描述**: 查詢客戶的當前點數餘額和統計信息

**查詢參數**:
```
customerId=patient-001&customerType=patient&clinicId=clinic-001
```

**返回範例**:
```json
{
  "id": "balance-001",
  "customerId": "patient-001",
  "customerType": "patient",
  "balance": 550,                    // 當前餘額
  "totalEarned": 1100,               // 累計獲得點數
  "totalRedeemed": 550,              // 累計使用點數
  "clinicId": "clinic-001",
  "version": 5,                      // 樂觀鎖版本號（內部使用）
  "createdAt": "2026-02-01T00:00:00Z",
  "updatedAt": "2026-02-12T10:35:00Z"
}
```

**HTTP 狀態碼**:
- `200 OK`: 成功取得餘額
- `404 Not Found`: 客戶的點數餘額不存在

---

### 4. 取得交易歷史

**端點**: `GET /points/transactions`

**描述**: 查詢客戶的點數交易歷史記錄

**查詢參數**:
```
customerId=patient-001&customerType=patient&clinicId=clinic-001&limit=20
```

- `customerId` (必填): 客戶 ID
- `customerType` (必填): 客戶類型
- `clinicId` (必填): 診所 ID
- `limit` (可選, 默認 20): 返回記錄數量上限

**返回範例**:
```json
[
  {
    "id": "tx-002",
    "customerId": "patient-001",
    "customerType": "patient",
    "type": "redeem",
    "amount": -50,
    "balance": 550,
    "source": "treatment",
    "clinicId": "clinic-001",
    "treatmentId": "treat-123",
    "createdAt": "2026-02-12T10:35:00Z",
    "updatedAt": "2026-02-12T10:35:00Z"
  },
  {
    "id": "tx-001",
    "customerId": "patient-001",
    "customerType": "patient",
    "type": "earn_referral",
    "amount": 100,
    "balance": 600,
    "source": "referral",
    "clinicId": "clinic-001",
    "referralId": "referral-123",
    "createdAt": "2026-02-12T10:30:00Z",
    "updatedAt": "2026-02-12T10:30:00Z"
  }
]
```

**HTTP 狀態碼**:
- `200 OK`: 成功取得交易歷史
- `404 Not Found`: 客戶不存在或無交易記錄

---

## 數據模型

### PointsBalance (點數餘額表)

用於記錄每個客戶的當前點數狀態。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| customerId | varchar(32) | 客戶 ID |
| customerType | varchar(20) | 客戶類型 ('staff' \| 'patient') |
| balance | decimal(10,2) | 當前餘額 |
| totalEarned | decimal(10,2) | 累計獲得 |
| totalRedeemed | decimal(10,2) | 累計使用 |
| clinicId | varchar(32) | 診所 ID |
| version | int | 樂觀鎖版本號 |
| createdAt | timestamp | 創建時間 |
| updatedAt | timestamp | 更新時間 |

**唯一約束**: (customerId, customerType) - 每個客戶在每個診所只有一條記錄

---

### PointsTransaction (點數交易表)

記錄所有點數的增減交易。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| customerId | varchar(32) | 客戶 ID |
| customerType | varchar(20) | 客戶類型 |
| type | varchar(50) | 交易類型 ('earn_referral' \| 'redeem' \| 'expire' \| 'manual_adjust') |
| amount | decimal(10,2) | 變動金額（正為增加，負為扣減） |
| balance | decimal(10,2) | 交易後的餘額 |
| source | varchar(50) | 來源 ('referral' \| 'treatment' \| 'manual') |
| referralId | varchar(32) | 關聯推薦 ID（可選） |
| treatmentId | varchar(32) | 關聯療程 ID（可選） |
| clinicId | varchar(32) | 診所 ID |
| notes | text | 備註（可選） |
| createdAt | timestamp | 創建時間 |
| updatedAt | timestamp | 更新時間 |

---

### PointsConfig (點數配置表)

存儲點數系統的全局配置。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| configKey | varchar(100) | 配置鍵 |
| configValue | decimal(10,2) | 配置值 |
| description | text | 描述 |
| unit | varchar(50) | 單位 ('points' \| 'percentage' \| 'months' \| 'currency') |
| clinicId | varchar(32) | 診所 ID |
| isActive | boolean | 是否激活（默認 true） |
| createdAt | timestamp | 創建時間 |
| updatedAt | timestamp | 更新時間 |

**預設配置**:
- `referral_points_reward`: 推薦獎勵點數（默認 100）
- `points_to_currency_rate`: 點數兌現比率（默認 0.1，即 100 點 = $10）
- `max_redeem_percentage`: 單次兌現上限（默認 50%）
- `points_expiry_months`: 點數有效期（默認 12 個月）
- `min_redeem_amount`: 最少兌現點數（默認 10）

---

## 錯誤處理

### 常見錯誤

#### 1. 點數不足
```json
{
  "statusCode": 400,
  "message": "點數不足。目前餘額：30，需要：100",
  "error": "Bad Request"
}
```

#### 2. 無效金額
```json
{
  "statusCode": 400,
  "message": "獎勵點數必須大於 0",
  "error": "Bad Request"
}
```

#### 3. 樂觀鎖衝突（極罕見）
```json
{
  "statusCode": 409,
  "message": "經過 3 次重試後仍無法更新點數餘額：version mismatch",
  "error": "Conflict"
}
```

#### 4. 客戶不存在
```json
{
  "statusCode": 404,
  "message": "點數餘額不存在 - 客戶 patient-999",
  "error": "Not Found"
}
```

---

## 使用案例

### 案例 1: 推薦獎勵

當患者推薦新客戶成功轉診時：

```bash
curl -X POST http://localhost:3000/points/award \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "patient-001",
    "customerType": "patient",
    "type": "earn_referral",
    "amount": 100,
    "source": "referral",
    "clinicId": "clinic-001",
    "referralId": "referral-123"
  }'
```

### 案例 2: 點數兌換

客戶使用點數於療程折扣：

```bash
curl -X POST http://localhost:3000/points/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "patient-001",
    "customerType": "patient",
    "amount": 50,
    "clinicId": "clinic-001",
    "treatmentId": "treat-123"
  }'
```

### 案例 3: 查詢餘額

```bash
curl "http://localhost:3000/points/balance?customerId=patient-001&customerType=patient&clinicId=clinic-001"
```

### 案例 4: 查詢交易歷史

```bash
curl "http://localhost:3000/points/transactions?customerId=patient-001&customerType=patient&clinicId=clinic-001&limit=50"
```

---

## 設計原則

### 1. 自動重試機制

- 針對樂觀鎖衝突自動重試最多 3 次
- 使用指數退避延遲：(2^attempt - 1) * 100ms
- 超過重試次數後拋出 ConflictException
- 這確保了高並發環境下的穩定性

### 2. 樂觀鎖控制

- PointsBalance 使用 `@VersionColumn()` 進行版本控制
- 每次更新時版本號自動遞增
- 防止並發更新導致的數據不一致

### 3. 多租戶隔離

- 所有表都包含 `clinicId` 欄位
- 確保不同診所的數據完全隔離
- API 調用必須提供 `clinicId` 參數

### 4. 審計追蹤

- 每個點數變動都記錄在 PointsTransaction 表中
- 支持完整的交易歷史查詢
- 便於計費和審計

---

## 性能優化

### 冗餘欄位快取

Patient 和 Staff entities 中的 `pointsBalance` 欄位作為快取：
- PointsBalance 表是權威數據源
- Patient/Staff 的 pointsBalance 用於快速查詢
- 定期同步任務確保數據一致性

### 索引建議

數據庫應在以下欄位上建立索引：
- PointsBalance: (customerId, customerType)
- PointsTransaction: (customerId, createdAt)
- PointsTransaction: (clinicId, createdAt)

---

## 測試覆蓋

- **119 個單元測試**：涵蓋所有 entities、DTOs、services 和 controller
- **測試通過率**：100%
- **測試類型**：
  - Entity 結構驗證
  - DTO 驗證規則
  - Service 業務邏輯
  - Controller API 邏輯

---

## 相關文檔

- [Phase 2 設計決策](/PHASE2_DESIGN.md)
- [Points 系統架構](/POINTS_ARCHITECTURE.md)
- [API 錯誤代碼參考](/API_ERRORS.md)
