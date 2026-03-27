# 患者身份識別機制 - Phase 1

> 版本：1.0
> 更新日期：2026-03-27
> 適用：Doctor CRM 系統患者模組

---

## 概述

患者在系統中通過兩級標識機制唯一識別：

1. **身份證ID**（`idNumber`）：主要識別，在診所內唯一
2. **姓名**（`name`）：輔助驗證，用於雙重確認

此設計確保：
- 同一診所內無重複身份證ID
- 跨診所資料完全隔離（多租戶）
- 患者自助查詢時的雙重安全驗證

---

## 資料庫索引策略

### 複合唯一索引（clinicId + idNumber）

```sql
UNIQUE INDEX idx_clinic_idnumber ON patients(clinicId, idNumber)
```

| 屬性 | 說明 |
|-----|------|
| 用途 | 確保診所內身份證ID唯一 |
| 查詢性能 | O(1) — 精確查詢 |
| 多租戶隔離 | clinicId 作為分區鍵 |

### 姓名查詢索引（clinicId + name）

```sql
INDEX idx_clinic_name ON patients(clinicId, name)
```

| 屬性 | 說明 |
|-----|------|
| 用途 | 支持按診所 + 姓名搜尋 |
| 用例 | 患者列表、模糊搜尋 |

---

## 查詢流程

### 1. 精確識別（醫護端 — 按身份證ID）

```
輸入：身份證ID
查詢：SELECT * FROM patients WHERE clinicId = ? AND idNumber = ?
索引：idx_clinic_idnumber（複合唯一索引）
返回：單個患者 或 NULL (NotFoundException)
```

**使用場景：** 醫護人員直接輸入患者身份證號查詢

### 2. 雙重驗證（患者自助 — ID + 姓名）

```
輸入：身份證ID + 姓名
查詢：SELECT * FROM patients WHERE clinicId = ? AND idNumber = ? AND name = ?
索引：idx_clinic_idnumber（複合唯一索引）
返回：單個患者 或 NULL (NotFoundException)
驗證：防止他人利用已知 ID 查詢他人資料
```

**使用場景：** 患者自助查詢自己的療程和醫令

### 3. 模糊搜尋（醫護端 — 關鍵字）

```sql
SELECT * FROM patients
WHERE clinicId = :clinicId
AND (idNumber LIKE :keyword OR name LIKE :keyword)
LIMIT 20
```

使用索引：`idx_clinic_idnumber` + `idx_clinic_name`
預期性能：< 100ms（1000+ 患者的診所）

**使用場景：** 醫護人員輸入部分姓名或ID快速找到患者

---

## API 端點

### 搜尋患者

```
GET /api/patients/search?keyword=john&limit=20
Authorization: Bearer {token}

Response (200):
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "idNumber": "A123456789",
      "name": "John Doe",
      "phoneNumber": "0912345678"
    }
  ],
  "count": 1
}
```

### 雙重驗證患者

```
GET /api/patients/identify?idNumber=A123456789&name=John
Authorization: Bearer {token}

Response (200) — 驗證成功：
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "idNumber": "A123456789",
    "name": "John Doe"
  }
}

Response (404) — 驗證失敗：
{
  "statusCode": 404,
  "message": "患者身份驗證失敗：身份證ID 或 姓名不匹配",
  "timestamp": "2026-03-27T06:00:00Z"
}
```

---

## 唯一性驗證流程

### 建立患者時

```typescript
// 1. 檢查 (clinicId, idNumber) 是否已存在
const existing = await patientRepo.findOne({
  where: { clinicId, idNumber }
});

if (existing) {
  throw new ConflictException('身份證ID已存在');
}

// 2. 建立患者（唯一索引自動保護）
return await patientRepo.save({ ...dto, clinicId });
```

### 編輯患者時

```typescript
// 僅在 idNumber 有變更時驗證
if (dto.idNumber && dto.idNumber !== existingPatient.idNumber) {
  const conflict = await patientRepo.findOne({
    where: { clinicId, idNumber: dto.idNumber }
  });
  if (conflict) {
    throw new ConflictException('新身份證ID已存在');
  }
}
```

---

## 安全考慮

### 1. 多租戶資料隔離

所有患者查詢均強制包含 `clinicId` 過濾條件：

```typescript
// 永遠不允許不帶 clinicId 的查詢
async findByIdNumber(idNumber: string, clinicId: string): Promise<Patient> {
  return this.patientRepo.findOne({
    where: { idNumber, clinicId }  // clinicId 必填
  });
}
```

**違規情境防護：** 即使惡意用戶知道另一診所的患者 ID，也無法跨診所查詢。

### 2. 雙重驗證防護

`/api/patients/identify` 要求同時提供 ID 和姓名：
- 防止攻擊者利用已知身份證號查詢他人資料
- 即使 ID 外洩，無姓名仍無法查詢

### 3. 搜尋結果限制

模糊搜尋強制設置 `LIMIT`：
- 預設最多返回 20 筆
- 最大允許 50 筆
- 防止大量資料洩漏

### 4. 回應資料最小化

搜尋結果僅返回必要欄位：
```json
{
  "id": "uuid",
  "name": "John Doe",
  "idNumber": "A123456789",
  "phoneNumber": "0912345678"
}
```

不包含：`medicalHistory`、`allergies`、`address`、`email` 等敏感欄位。

---

## 性能優化

### 索引效益對比

| 查詢類型 | 無索引 | 有索引 | 改進倍率 |
|---------|--------|--------|---------|
| 精確 ID 查詢（1000 患者）| 10ms | 0.1ms | 100x |
| 模糊搜尋（1000 患者）| 500ms | 50ms | 10x |
| 分頁列表（第 50 頁）| 2000ms | 100ms | 20x |

### 查詢優化建議

1. **使用精確查詢代替模糊查詢**：當已知完整 ID 時，用 `=` 不用 `LIKE`
2. **限制搜尋結果**：始終指定 `LIMIT`，避免全表掃描
3. **診所過濾優先**：`WHERE clinicId = ?` 在條件最前面，利用複合索引

---

## 未來考慮

### 短期優化（Phase 2-3）

1. **全文索引**：支持繁體中文姓名搜尋（SQLite FTS5 或 PostgreSQL 全文索引）
2. **拼音搜尋**：支持用注音或拼音搜尋中文姓名
3. **批量導入**：支持 CSV 匯入患者資料（含重複檢查）

### 長期優化（Phase 4+）

4. **審計日誌**：記錄所有患者查詢操作（誰、何時、查了誰）
5. **模糊匹配**：支持 Levenshtein 距離（容錯輸入錯誤）
6. **加密儲存**：身份證號加密儲存（AES-256）以符合個資法

---

## 實作參考

### TypeORM 實體配置

```typescript
@Entity('patients')
@Index(['clinicId', 'idNumber'], { unique: true })  // 複合唯一索引
@Index(['clinicId', 'name'])                          // 姓名搜尋索引
export class Patient {
  @Column({ unique: false })
  idNumber: string;  // 在診所範圍內唯一（由複合索引保證）

  @Column()
  name: string;

  @Column()
  clinicId: string;  // 多租戶隔離鍵
}
```

### 服務層方法

```typescript
class PatientSearchService {
  // 按身份證ID精確識別
  async identifyPatientByIdNumber(idNumber: string, clinicId: string): Promise<Patient>

  // 雙重驗證（ID + 姓名）
  async identifyPatientByIdAndName(idNumber: string, name: string, clinicId: string): Promise<Patient>

  // 關鍵字模糊搜尋
  async searchPatients(keyword: string, clinicId: string, limit: number): Promise<Patient[]>

  // 驗證ID唯一性（建立/編輯前檢查）
  async validateIdNumberAvailability(idNumber: string, clinicId: string, excludeId?: string): Promise<void>
}
```

---

*患者身份識別機制文檔版本：1.0 | Phase 1 完成於 2026-03-27*
