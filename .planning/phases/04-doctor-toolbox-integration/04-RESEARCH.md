# Phase 4: Doctor Toolbox 整合 - Research

**研究日期：** 2026-03-30
**主要領域：** Bidirectional sync, Webhook infrastructure, Patient data matching, Conflict resolution
**信心度：** HIGH (CONTEXT7 + official docs verified)

## Summary

Doctor Toolbox 整合涉及構建雙向資料同步機制，以 Doctor CRM 作為患者身份的主控系統，並透過 Webhook 實現 Doctor Toolbox 的即時推送更新。核心設計依賴已驗證的模式：NestJS EventEmitter2 驅動（現有系統已使用）、HMAC-SHA256 Webhook 簽名驗證、指數退避重試（無需訊息佇列）、以及專用索引表實現快速患者查詢。本階段應重點關注冪等性設計（防重複同步）、衝突解決策略（CRM 為權威來源）、以及多診所隔離（防止資料洩露）。

**核心建議：** 實作 Webhook 驗證中介層 + 同步索引表（sync_patient_index）+ 冪等性事務管理，以支援最終一致性同步與完整的審計追蹤。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Sync 機制：** Webhook 推送為主（Doctor Toolbox → Doctor CRM 即時），失敗採指數退避重試（3-5 次嘗試）
- **衝突解決：** Doctor CRM 為患者更改的權威來源；可編輯欄位限核心身份（name, idNumber, contact）；醫療資料單向（CRM 獨有）
- **患者查詢：** 精確匹配（idNumber + name），備用查詢（name + phone）；建立 sync_patient_index 表追蹤映射與同步狀態
- **API 合約：** 最小化同步表面（核心身份欄位：id, name, idNumber, phone, email），字段不匹配時明確失敗（防無聲資料遺失）

### Claude's Discretion
- 精確重試退避公式（例：2s, 4s, 8s, 16s）
- Webhook 簽名驗證方法
- 批量同步的效能最佳化（批處理、逾時處理）
- 同步審計追蹤的記錄粒度

### Deferred Ideas (OUT OF SCOPE)
- 排程批量同步工作（nightly reconciliation）→ Phase 4b
- Toolbox→CRM 治療/療法資料同步 → Phase 5
- Doctor Toolbox UI 整合於 Doctor CRM → 單獨階段
- 進階衝突解決（欄位級規則、合併策略）→ Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTEGRATION-01 | API 對接設計文檔 | Webhook 架構、HMAC 驗證、資料轉換映射已驗證；NestJS patterns 已確立 |
| INTEGRATION-02 | 雙向資料同步機制 | Webhook 驅動 + 冪等性金鑰 + 最終一致性，無訊息佇列依賴 |
| INTEGRATION-03 | 身份證ID與姓名索引查詢 | sync_patient_index 表設計，複合索引 (idNumber, name, toolbox_patient_id) |
| INTEGRATION-04 | 共用資料庫架構 | Patient 實體擴展 (syncStatus, lastSyncAt)，sync_patient_index 關聯表 |
</phase_requirements>

## Standard Stack

### Core Libraries
| 函式庫 | 版本 | 用途 | 為何標準 |
|-------|------|------|--------|
| NestJS | 11.x | Webhook endpoint、service layer、guards | 現有系統基礎；EventEmitter2 已整合 |
| TypeORM | 0.3.x | sync_patient_index 表、複合索引、事務管理 | 與 Patient entity 同一 ORM；支援 SQLite/MySQL/PostgreSQL |
| crypto (Node.js built-in) | — | HMAC-SHA256 簽名驗證 | 無額外相依性；業界標準(65% webhook 使用) |
| EventEmitter2 | 已依賴 | Patient 同步事件發送 | 現有系統已用於 course.started/completed 事件 |

### Supporting Libraries
| 函式庫 | 版本 | 用途 | 使用時機 |
|-------|------|------|--------|
| rxjs | 已依賴 | Retry logic 實現（retry operator）| 若採 RxJS 實現退避，否則原生 async/await |
| class-validator | 已依賴 | Webhook payload DTO 驗證 | 標準 NestJS DTO 驗證模式 |
| uuid | 已依賴 | 冪等性金鑰生成 | Doctor CRM 端產生同步請求時 |

### Alternatives Considered
| 替代方案 | 原因排除 | 何時考慮 |
|--------|--------|--------|
| Bull/Agenda（訊息佇列） | 增加營運複雜度，指數退避足以應對短期失敗；nightly sync 再考慮 | Phase 4b nightly reconciliation |
| Temporal.io（workflow engine） | 過度設計；核心需求是簡單重試 + 事務性 | 若需複雜工作流協調 |
| Fuzzy matching（患者匹配） | User 決策：精確匹配確保透明度，降低誤配風險 | 不適用 |
| GraphQL subscription（即時推送） | Webhook 更適合 B2B 安全性需求；GraphQL 加重客戶端複雜度 | 若 Doctor Toolbox 需 real-time 拉取 |

**安裝（無新增相依性）：**
```bash
# 核心依賴已在 package.json 中，無需新增
# 驗證：
npm ls nestjs typeorm class-validator
```

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
├── doctor-toolbox-sync/
│   ├── controllers/
│   │   └── webhook.controller.ts          # Webhook endpoint (POST /sync/webhook)
│   ├── services/
│   │   ├── webhook.service.ts             # 驗簽 + payload 解析
│   │   ├── sync-patient.service.ts        # 患者同步邏輯 (查詢、衝突解決、轉換)
│   │   ├── sync-index.service.ts          # sync_patient_index CRUD
│   │   └── sync-audit.service.ts          # 審計日誌
│   ├── entities/
│   │   └── sync-patient-index.entity.ts   # 映射與狀態追蹤
│   ├── dto/
│   │   ├── webhook-payload.dto.ts         # Doctor Toolbox webhook schema
│   │   ├── sync-request.dto.ts            # 內部同步要求
│   │   └── sync-response.dto.ts           # 同步結果
│   ├── guards/
│   │   └── webhook-signature.guard.ts     # HMAC 簽名驗證
│   ├── listeners/
│   │   └── patient-sync.listener.ts       # Patient lifecycle events → outbound sync
│   └── doctor-toolbox-sync.module.ts      # Module 定義
│
└── common/
    ├── entities/
    │   └── sync-audit-log.entity.ts       # 審計記錄實體
    └── enums/
        └── sync-status.enum.ts            # 'pending', 'synced', 'conflict', 'failed'
```

### Pattern 1: Webhook 驗簽與冪等性

**功能：** 驗證 Doctor Toolbox 簽名、提取 payload、檢測重複（idempotency key），轉送至 sync logic

**使用場景：** 每個 Webhook 請求進入時執行，在 guard 層執行簽名檢驗，在 service 層實現冪等性

**實現要點：**
```typescript
// Source: NestJS official docs + HMAC webhook patterns (medium.com)

// 1. Guard: 簽名驗證
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-signature'];
    const timestamp = request.headers['x-timestamp'];
    const body = JSON.stringify(request.body);

    // 時戳驗證：防重放攻擊（容許 5 分鐘偏差）
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      throw new UnauthorizedException('Timestamp expired');
    }

    // HMAC-SHA256 驗簽
    const secret = this.configService.get('DOCTOR_TOOLBOX_WEBHOOK_SECRET');
    const message = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}

// 2. Service: 冪等性與同步
@Injectable()
export class WebhookService {
  constructor(
    private syncIndexService: SyncPatientIndexService,
    private syncPatientService: SyncPatientService,
    private auditService: SyncAuditService,
  ) {}

  async processWebhook(payload: WebhookPayloadDto): Promise<void> {
    const idempotencyKey = payload.webhookId; // Doctor Toolbox 提供唯一 ID

    // 檢查冪等性：該 webhook 是否已處理
    const existing = await this.syncIndexService.findByWebhookId(idempotencyKey);
    if (existing && existing.syncStatus === 'synced') {
      this.auditService.log({
        action: 'DUPLICATE_WEBHOOK',
        webhookId: idempotencyKey,
        result: 'SKIPPED',
      });
      return; // 冪等性保證：重複請求直接返回
    }

    // 標記為「處理中」
    await this.syncIndexService.createOrUpdate({
      webhookId: idempotencyKey,
      syncStatus: 'pending',
    });

    try {
      // 患者資料同步邏輯
      const result = await this.syncPatientService.syncFromToolbox(payload);

      // 同步成功
      await this.syncIndexService.update(idempotencyKey, {
        syncStatus: 'synced',
        toolboxPatientId: payload.patientId,
        crmPatientId: result.id,
        lastSyncAt: new Date(),
      });

      this.auditService.log({
        action: 'SYNC_SUCCESS',
        webhookId: idempotencyKey,
        patientId: result.id,
      });
    } catch (error) {
      await this.syncIndexService.update(idempotencyKey, {
        syncStatus: 'failed',
        errorMessage: error.message,
      });

      this.auditService.log({
        action: 'SYNC_FAILED',
        webhookId: idempotencyKey,
        error: error.message,
      });

      throw error; // HTTP 500，Doctor Toolbox 會重試
    }
  }
}
```

### Pattern 2: 患者查詢與衝突解決

**功能：** 根據 idNumber + name 查詢現有患者，套用衝突解決策略（latest data wins，但 CRM 為權威）

**使用場景：** 同步 webhook 時查詢目標患者，首先精確匹配，備用 name + phone

**實現要點：**
```typescript
// Source: Existing Patient entity + TypeORM composite index patterns

@Injectable()
export class SyncPatientService {
  constructor(
    private patientService: PatientService,
    private syncIndexService: SyncPatientIndexService,
    private auditService: SyncAuditService,
  ) {}

  async syncFromToolbox(payload: WebhookPayloadDto, clinicId: string): Promise<Patient> {
    // 1. 精確查詢：(clinicId, idNumber, name)
    let patient = await this.patientService.findByIdNumberAndName(
      clinicId,
      payload.idNumber,
      payload.name,
    );

    // 2. 備用查詢：(clinicId, name, phone)
    if (!patient && payload.phoneNumber) {
      patient = await this.patientService.findByNameAndPhone(
        clinicId,
        payload.name,
        payload.phoneNumber,
      );
    }

    // 3. 新患者：創建
    if (!patient) {
      patient = await this.patientService.create({
        clinicId,
        idNumber: payload.idNumber,
        name: payload.name,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
      });

      this.auditService.log({
        action: 'PATIENT_CREATED',
        source: 'TOOLBOX',
        patientId: patient.id,
      });

      return patient;
    }

    // 4. 現有患者：衝突解決
    const updated = await this.resolveConflict(patient, payload, clinicId);

    return updated;
  }

  private async resolveConflict(
    existing: Patient,
    incoming: WebhookPayloadDto,
    clinicId: string,
  ): Promise<Patient> {
    // CRM 為權威：僅更新 Toolbox 提供的欄位（不覆蓋 CRM 獨有的醫療資料）
    // 可編輯欄位：name, idNumber, phoneNumber, email, address

    const updates: Partial<Patient> = {};

    // 策略：Latest Timestamp Wins（比較 lastSyncAt）
    if (!existing.lastSyncAt || new Date(payload.updatedAt) > existing.lastSyncAt) {
      if (payload.name && payload.name !== existing.name) {
        updates.name = payload.name;
      }
      if (payload.phoneNumber && payload.phoneNumber !== existing.phoneNumber) {
        updates.phoneNumber = payload.phoneNumber;
      }
      if (payload.email && payload.email !== existing.email) {
        updates.email = payload.email;
      }
      if (payload.address && payload.address !== existing.address) {
        updates.address = payload.address;
      }
    }

    // 若有更新，執行更新並審計
    if (Object.keys(updates).length > 0) {
      const updated = await this.patientService.update(existing.id, updates);

      this.auditService.log({
        action: 'PATIENT_UPDATED',
        source: 'TOOLBOX',
        patientId: existing.id,
        changedFields: Object.keys(updates),
      });

      return updated;
    }

    return existing;
  }
}
```

### Pattern 3: 出站同步（CRM → Toolbox）

**功能：** 當 CRM 患者資料變更時，觸發事件向 Doctor Toolbox 推送更新（帶重試邏輯）

**使用場景：** Patient entity 變更時（create/update）發送事件，listener 實現出站同步

**實現要點：**
```typescript
// Source: Existing PatientEventListener pattern + exponential backoff

@Injectable()
export class PatientSyncListener {
  constructor(
    private readonly syncPatientService: SyncPatientService,
    private readonly auditService: SyncAuditService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent('patient.updated')
  async onPatientUpdated(event: PatientUpdatedEvent): Promise<void> {
    const syncableFields = ['name', 'idNumber', 'phoneNumber', 'email'];
    const hasChanges = event.changes.some(field => syncableFields.includes(field));

    if (!hasChanges) {
      return; // 無相關欄位變更，略過同步
    }

    await this.syncToToolbox(event.patient, 'update');
  }

  @OnEvent('patient.created')
  async onPatientCreated(event: PatientCreatedEvent): Promise<void> {
    await this.syncToToolbox(event.patient, 'create');
  }

  private async syncToToolbox(patient: Patient, action: 'create' | 'update'): Promise<void> {
    const maxAttempts = 5;
    const baseDelay = 2000; // 2 秒

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.pushToToolbox(patient, action);

        this.auditService.log({
          action: 'OUTBOUND_SYNC_SUCCESS',
          patientId: patient.id,
          syncAction: action,
          attempt: attempt + 1,
        });

        return; // 成功，結束重試
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          // 最後一次失敗
          this.auditService.log({
            action: 'OUTBOUND_SYNC_FAILED_FINAL',
            patientId: patient.id,
            syncAction: action,
            attempts: maxAttempts,
            error: error.message,
          });

          throw new SyncException(`Failed to sync patient ${patient.id} after ${maxAttempts} attempts`);
        }

        // 指數退避 + 隨機抖動
        const jitter = Math.random() * 0.1; // 10% 抖動
        const delay = baseDelay * Math.pow(2, attempt) * (1 + jitter);

        this.auditService.log({
          action: 'OUTBOUND_SYNC_RETRY',
          patientId: patient.id,
          attempt: attempt + 1,
          nextRetryIn: delay,
        });

        await this.sleep(delay);
      }
    }
  }

  private async pushToToolbox(patient: Patient, action: 'create' | 'update'): Promise<void> {
    const url = this.configService.get('DOCTOR_TOOLBOX_API_URL');
    const apiKey = this.configService.get('DOCTOR_TOOLBOX_API_KEY');

    const payload = {
      action,
      patient: {
        idNumber: patient.idNumber,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
      },
    };

    // HTTP 呼叫（可用 axios、fetch 等）
    const response = await fetch(`${url}/sync/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Toolbox API error: ${response.status} ${response.statusText}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Anti-Patterns to Avoid

- **無冪等性設計：** 相同 webhook 多次處理導致重複同步。→ 使用 webhookId + sync_patient_index 表檢查
- **忽視時戳驗證：** 重放攻擊風險。→ 在 HMAC 驗簽中加入 5 分鐘時戳容許
- **同步時塊住主執行流：** Webhook handler 應快速返回，重試在背景執行。→ 使用 EventEmitter + listener 分離
- **跨診所資料洩露：** 查詢患者時未過濾 clinicId。→ 所有 sync 操作必經 PatientService（內部強制 clinicId 過濾）
- **無聲忽略衝突：** 資料遺失。→ 不匹配的欄位應記錄錯誤並明確失敗

## Don't Hand-Roll

| 問題 | 不建議自建 | 改用 | 為何 |
|------|----------|------|------|
| 簽名驗證 | 自實現 HMAC 演算法 | Node.js crypto 模組 + crypto.timingSafeEqual | 易有計時攻擊漏洞；內建模組已優化與審查 |
| Webhook 重試 | 自寫迴圈 + setTimeout | EventEmitter2 + listener + exponential backoff 工具函式 | 複雜度高，易漏掉邊界情況（取消、超時）；成熟模式已驗證 |
| 患者匹配 | 自寫模糊匹配演算法 | TypeORM 精確複合索引查詢 | User 已鎖定精確匹配；模糊匹配增維度複雜度 & 誤配風險 |
| 事務管理 | 手動開始/提交/回滾 | TypeORM Repository.manager.transaction + QueryRunner | TypeORM 提供原子性保證；手動易遺漏 commit/rollback |
| 冪等性金鑰儲存 | 記憶體快取 (Map/WeakMap) | 資料庫唯一約束 (sync_patient_index) | 進程重啟遺失；唯一約束在多進程環境下可靠 |

**核心洞察：** Webhook security（HMAC、時戳、重放保護）和 idempotency（資料庫級約束）是分散式系統的難點，應仰賴既驗證的工具與模式而非自寫。

## Common Pitfalls

### Pitfall 1: 冪等性未實現導致重複同步

**發生原因：** Webhook 失敗重試時，若無冪等性檢查，相同患者資料被多次處理，導致審計混亂、重複事件發送

**預防策略：**
1. 在 sync_patient_index 表建立 UNIQUE(webhookId) 約束
2. 每個 webhook handler 開始時先查詢；若 syncStatus='synced'，直接返回
3. 使用資料庫事務確保 sync_patient_index 與 Patient 更新原子性

**檢測信號：** 審計日誌中同一 webhookId 多次 'SYNC_SUCCESS' 記錄

### Pitfall 2: 時戳驗證缺失導致重放攻擊

**發生原因：** Webhook 驗簽只檢查 HMAC，未驗證時戳，攻擊者可重複傳送舊 webhook

**預防策略：**
1. 在 WebhookSignatureGuard 中驗證 `x-timestamp` 頭，容許 300 秒（5 分鐘）偏差
2. 拒絕超過容許時間的請求（UnauthorizedException）

**檢測信號：** 歷史時間點的 webhook 被接受；或同一 webhookId 在長時間內多次出現

### Pitfall 3: 跨診所資料洩露

**發生原因：** Webhook sync logic 在查詢患者時未驗證 clinicId，導致查詢到其他診所患者

**預防策略：**
1. 所有患者查詢必經過 PatientService（內部強制 clinicId 過濾）
2. Webhook handler 必從 JWT token 或 webhook header 提取 clinicId
3. 測試：模擬跨診所同步，驗證返回 forbidden/not-found

**檢測信號：** 患者在多個診所中出現；或 sync 日誌顯示查詢未過濾 clinicId

### Pitfall 4: 出站同步在 request lifecycle 中阻塞

**發生原因：** PatientController 更新患者後，等待出站同步完成才返回，timeout 風險

**預防策略：**
1. 更新患者後發送 patient.updated 事件（同步）
2. 事件監聽器以非同步方式執行出站同步（EventEmitter 預設非同步）
3. Controller 不等待 listener 完成，快速返回 200 OK

**檢測信號：** API 響應時間長（>5s）；或 timeout 錯誤多見

### Pitfall 5: 欄位映射不匹配導致無聲資料遺失

**發生原因：** Webhook payload 包含未預期欄位，sync logic 忽略它們，導致資料在 Doctor Toolbox 無法同步回 CRM

**預防策略：**
1. WebhookPayloadDto 使用 @IsIn() 或 white-list 驗證欄位
2. 若 payload 包含非預期欄位，DTO 驗證應失敗（不用 @IsOptional()）
3. 實現欄位版本化：payload 中包含 `schemaVersion` 以相容未來變更

**檢測信號：** Webhook 回傳 400 Bad Request；或審計日誌顯示 'VALIDATION_ERROR'

### Pitfall 6: 衝突解決策略含糊導致資料不一致

**發生原因：** CRM 與 Toolbox 同時更新患者資料，衝突解決規則不清（誰贏？哪個時間戳優先？）

**預防策略：**
1. 明確定義：CRM 為核心身份的權威，Toolbox 更新僅更新特定欄位（name, phone, email, address）
2. 使用 lastSyncAt 時戳比較，較新更新優先，但 CRM 更新永遠勝出
3. 衝突時記錄 syncStatus='conflict' 到 sync_patient_index，供人工審查

**檢測信號：** sync_patient_index 中多個 'conflict' 記錄；或患者資料在兩系統中不一致

## Code Examples

### Example 1: Webhook Controller 與簽名驗證

```typescript
// Source: NestJS official docs + HMAC webhook patterns

@Controller('sync')
@UseGuards(WebhookSignatureGuard)
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
  ) {}

  @Post('webhook')
  async receiveWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-clinic-id') clinicId: string,
  ): Promise<{ status: string }> {
    // Guard 已驗證簽名，此時 payload 可信
    await this.webhookService.processWebhook(payload, clinicId);

    return { status: 'received' };
  }
}
```

### Example 2: Sync Index Entity 定義

```typescript
// Source: Existing TypeORM patterns (Patient, TreatmentCourse entities)

@Entity('sync_patient_index')
@Index(['clinicId', 'toolboxPatientId'], { unique: true })
@Index(['clinicId', 'crmPatientId'], { unique: true })
@Index(['clinicId', 'idNumber', 'name']) // 複合查詢索引
export class SyncPatientIndex {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string; // 多診所隔離

  @Column({ type: 'varchar', length: 100, unique: true })
  webhookId: string; // 冪等性金鑰

  @Column({ type: 'varchar', length: 100, nullable: true })
  toolboxPatientId: string; // Doctor Toolbox 患者 ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  crmPatientId: string; // Doctor CRM 患者 ID（FK to Patient.id）

  @Column({ type: 'varchar', length: 50 })
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed'; // 同步狀態

  @Column({ type: 'text', nullable: true })
  errorMessage: string; // 失敗原因

  @Column({ type: 'varchar', length: 20, nullable: true })
  idNumber: string; // 身份證號（快速查詢）

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string; // 患者姓名（快速查詢）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date; // 最後同步時間
}
```

### Example 3: 最終一致性 + 審計日誌

```typescript
// Source: Existing AuditLog pattern + eventual consistency best practices

@Injectable()
export class SyncAuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(entry: {
    action: string;
    patientId?: string;
    webhookId?: string;
    source?: 'TOOLBOX' | 'CRM';
    result?: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    error?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // 非同步記錄，不應阻塞主流程
    await this.auditLogRepository.save({
      action: entry.action,
      entity: 'Patient',
      entityId: entry.patientId,
      changes: {
        webhookId: entry.webhookId,
        source: entry.source,
        result: entry.result,
        error: entry.error,
        ...entry.metadata,
      },
      createdAt: new Date(),
    });
  }
}
```

## State of the Art

| 舊做法 | 當前做法 | 變更時點 | 影響 |
|-------|--------|--------|------|
| 定期輪詢（polling） | Webhook 推送 | 2015+ | 實時性↑, 伺服器負載↓, 安全性↑ |
| 信號整合認證 | HMAC-SHA256 簽名 | 2018+ | 安全性↑, 業界 65% 採用, 易實現 |
| 自寫重試邏輯 | 指數退避 + jitter | 2020+ | 可靠性↑, 防止雷鳴羊群效應 |
| 共享密鑰 | 環境變數存儲 | 2019+ | 安全性↑, 降低金鑰暴露風險 |
| 單向同步 | 雙向同步 + CRM 權威 | 2021+ | 複雜度↑, 但資料一致性↑ |

**已棄用/過時：**
- **FTP/SFTP 檔案傳輸：** 轉向 Webhook + HTTPS（更安全、更即時）
- **資料庫直接連線：** 轉向 API（降低耦合、支援多廠商）
- **Timestamp-only 衝突解決：** 轉向 CRDT/vector clocks（適應完全分散式場景）

## Open Questions

1. **Doctor Toolbox API 安全認證方式是否確定？**
   - 已知：HMAC webhook 驗簽（CRM 端已確定）
   - 未知：Toolbox 接受 CRM 出站請求時，應使用 API Key、OAuth、或其他？
   - **建議：** 在 INTEGRATION-01 設計文檔中明確規範雙向認證

2. **Webhook payload schema 版本化需求？**
   - 已知：當前 v1 payload 欄位
   - 未知：未來 Toolbox 擴展欄位時，應如何相容？
   - **建議：** Payload 包含 `schemaVersion` 或在 header 中指定版本

3. **多診所情境下的 Webhook routing？**
   - 已知：Webhook 端點單一 (POST /sync/webhook)
   - 未知：Doctor Toolbox 如何傳達 clinicId？（header、payload、URL path？）
   - **建議：** clinicId 應在 webhook header 或簽名後的 payload 中明確包含

4. **衝突檢測精度要求？**
   - 已知：Last Timestamp Wins 策略
   - 未知：時戳精度（秒級？毫秒級？）對衝突判定的影響
   - **建議：** 使用 ISO 8601 毫秒精度時戳（2026-03-30T10:30:45.123Z）

5. **Bulk initial sync 的設計細節？**
   - 已知：新診所整合時需全量患者匯出
   - 未知：超過 10K 患者時，應分頁？批量大小？timeout 政策？
   - **建議：** Phase 4 實踐中迭代，或作為 Phase 4.1 專案

## Validation Architecture

### Test Framework

| 屬性 | 值 |
|------|-----|
| Framework | Jest 29.x + Supertest |
| Config file | `backend/jest.config.js` (existing) |
| Quick run command | `npm run test -- doctor-toolbox-sync --maxWorkers=2` |
| Full suite command | `npm run test:cov` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTEGRATION-01 | Webhook HMAC signature validation passes for valid signature | unit | `npm run test -- webhook-signature.guard.spec.ts` | ❌ Wave 0 |
| INTEGRATION-01 | Webhook rejects invalid signature (timingSafeEqual) | unit | `npm run test -- webhook-signature.guard.spec.ts` | ❌ Wave 0 |
| INTEGRATION-01 | Webhook rejects expired timestamp (>300s deviation) | unit | `npm run test -- webhook-signature.guard.spec.ts` | ❌ Wave 0 |
| INTEGRATION-02 | Webhook payload processed idempotently (webhookId check) | integration | `npm run test -- webhook.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-02 | Duplicate webhook skipped, audit logged as 'DUPLICATE_WEBHOOK' | integration | `npm run test -- webhook.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-02 | Exponential backoff retry fires on transient error (3+ attempts) | unit | `npm run test -- patient-sync.listener.spec.ts` | ❌ Wave 0 |
| INTEGRATION-03 | Patient lookup succeeds with exact match (idNumber + name) | unit | `npm run test -- sync-patient.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-03 | Patient lookup falls back to (name + phone) if idNumber missing | unit | `npm run test -- sync-patient.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-03 | Composite index (clinicId, idNumber, name) used in query plan | integration | `npm run test -- sync-patient.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-04 | Conflict resolution: CRM data wins over Toolbox update | unit | `npm run test -- sync-patient.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-04 | Sync audit log records action, source, patientId, timestamp | integration | `npm run test -- sync-audit.service.spec.ts` | ❌ Wave 0 |
| INTEGRATION-02 | Cross-clinic isolation: Webhook cannot sync patient from different clinic | integration | `npm run test -- webhook.service.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- doctor-toolbox-sync --maxWorkers=2 -x` (stop on first failure)
- **Per wave merge:** `npm run test:cov` (full coverage report)
- **Phase gate:** Full suite green + coverage ≥90% for new modules before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/src/doctor-toolbox-sync/guards/webhook-signature.guard.spec.ts` — covers INTEGRATION-01
- [ ] `backend/src/doctor-toolbox-sync/services/webhook.service.spec.ts` — covers INTEGRATION-02 (idempotency, multi-clinic)
- [ ] `backend/src/doctor-toolbox-sync/services/sync-patient.service.spec.ts` — covers INTEGRATION-02 (conflict resolution), INTEGRATION-03 (lookup)
- [ ] `backend/src/doctor-toolbox-sync/services/sync-audit.service.spec.ts` — covers audit logging
- [ ] `backend/src/doctor-toolbox-sync/listeners/patient-sync.listener.spec.ts` — covers outbound sync + retry logic
- [ ] `backend/src/doctor-toolbox-sync/entities/sync-patient-index.entity.ts` — covers INTEGRATION-04 (db schema)
- [ ] Framework install: `npm install @nestjs/schedule` (if scheduling nightly sync in Phase 4.1)

*(Wave 0 scope: Create stub test files with test describe blocks + setup fixtures. Implementation in Phase tasks.)*

## Sources

### Primary (HIGH confidence)

- **NestJS Official Docs** — [Events](https://docs.nestjs.com/techniques/events) (EventEmitter pattern, listener subscription)
- **HMAC Webhook Security** — [Hash-based Message Authentication Code](https://webhooks.fyi/security/hmac) (industry standard, 65% adoption)
- **NestJS HMAC Implementation** — [Secure Your NestJS APIs with HMAC Authentication](https://dev.to/kishanhimself/secure-api-to-api-communication-with-hmac-implementation-using-nestjs-aws-and-postman-38pd) (Medium, verified implementation)
- **Exponential Backoff Patterns** — [Webhook Retry Best Practices for Sending Webhooks](https://hookdeck.com/outpost/guides/outbound-webhook-retry-best-practices) (authoritative guide on retry strategy)
- **Idempotency in APIs** — [Idempotency in APIs: Designing Safe Retry Logic](https://dev.to/matt_frank_usa/idempotency-in-apis-designing-safe-retry-logic-1oal) (comprehensive design patterns)
- **Bidirectional Sync Patterns** — [Bidirectional Data Synchronization Patterns Between Systems](https://dev3lop.com/bidirectional-data-synchronization-patterns-between-systems/) (authoritative reference)

### Secondary (MEDIUM confidence)

- **Conflict Resolution Strategies** — [System Design Pattern: Conflict Resolution in Distributed Systems](https://medium.com/@priyasrivastava18official/system-design-pattern-from-chaos-to-consistency-the-art-of-conflict-resolution-in-distributed-9d631028bdb4) (verified with CRDT concepts)
- **Database Indexing for Query Performance** — [Boost Query Performance with Database Indexing: Expert Strategies](https://www.acceldata.io/blog/mastering-database-indexing-strategies-for-peak-performance) (composite index patterns)
- **Distributed Consistency Challenges** — [Distributed Data Consistency: Challenges & Solutions](https://endgrate.com/blog/distributed-data-consistency-challenges-and-solutions) (eventual consistency context)

### Tertiary (VERIFIED from codebase)

- **Existing Patient Entity** — `backend/src/patients/entities/patient.entity.ts` (composite index on clinicId + idNumber, models patient identity)
- **Existing EventEmitter Pattern** — `backend/src/notifications/listeners/notification-event.listener.ts` (demonstrates listener subscription + async handling)
- **Existing Error Handling** — `backend/src/common/exceptions/` (BusinessRuleException, ValidationException patterns)
- **Existing Multi-clinic Isolation** — `backend/src/staff/services/staff.service.ts` (clinicId filtering in queries)

## Metadata

**信心度分解：**
- Standard stack: **HIGH** — NestJS + TypeORM 已在現有系統驗證；HMAC + exponential backoff 是業界標準
- Architecture: **HIGH** — Webhook 驗簽、冪等性、衝突解決模式都源自官方文檔與驗證最佳實踐
- Pitfalls: **HIGH** — 來自 distributed systems 和 webhook 安全領域的已知陷阱
- Validation: **MEDIUM** — Jest 基礎已有，但具體 Doctor Toolbox 整合測試需 Phase 中迭代

**研究日期：** 2026-03-30
**有效期限至：** 2026-04-30 (28 天)

---

*Phase 4 Research 完成*
*下一步：Planner 將基於本報告建立 PLAN.md 檔案*
