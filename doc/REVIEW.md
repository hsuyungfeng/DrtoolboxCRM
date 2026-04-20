# Doctor Toolbox Sync 模組 — 程式碼審查報告

**審查日期：** 2026-04-20  
**深度：** standard（每檔案完整分析 + 跨檔案關鍵路徑追蹤）  
**審查範圍：** `doctor-toolbox-sync` 模組（controllers、services、entities、guards）+ `common/entities/sync-audit-log.entity.ts`  
**狀態：** 發現問題（CRITICAL: 4, HIGH: 4, MEDIUM: 4, LOW: 3）

---

## 總覽

本次審查涵蓋 13 個原始檔案。模組整體架構清晰，多租戶隔離理念正確。但存在數個可被利用的安全漏洞與邏輯錯誤，須在上線前修復。

---

## CRITICAL 問題

### CR-01：MigrationController 缺少租戶授權驗證（跨租戶資料存取）

**檔案：** `backend/src/doctor-toolbox-sync/controllers/migration.controller.ts:43-96`

**問題：**  
`POST /migrate/:clinicId`、`POST /migrate/:clinicId/resume`、`GET /migrate/:clinicId/progress`、`DELETE /migrate/:clinicId` 四個端點均使用 URL 路徑中的 `clinicId` 參數直接操作資料，但完全沒有驗證該 `clinicId` 是否與目前登入使用者（`req.user.clinicId`）相符。任何已認證的使用者只要知道其他診所的 `clinicId`，就可以啟動、中止、或查閱其他診所的遷移作業。

**修復：**
```typescript
@Post(':clinicId')
@HttpCode(HttpStatus.OK)
async startMigration(
  @Param('clinicId') clinicId: string,
  @Req() req: any,
): Promise<MigrationProgressDto> {
  // 驗證使用者只能操作自己的診所
  if (req.user.clinicId !== clinicId) {
    throw new ForbiddenException('無法存取其他診所的遷移資料');
  }
  const progress = await this.bulkExportService.startMigration(clinicId);
  return this.toDto(progress);
}
```
對 `resumeMigration`、`getProgress`、`abortMigration` 三個端點做同樣的處理。

---

### CR-02：WebhookSignatureGuard 簽名計算使用已解析的 JSON 物件而非原始請求體

**檔案：** `backend/src/doctor-toolbox-sync/guards/webhook-signature.guard.ts:75,101`

**問題：**  
`computeSignature` 中使用 `JSON.stringify(body)` 計算簽名，而 `body` 是 Express 已解析的 JavaScript 物件。在 JavaScript 中，`JSON.stringify` **不保證物件鍵的順序**（儘管 V8 引擎對字串鍵通常保持插入順序）。Doctor Toolbox 傳送端使用原始請求體字串計算簽名，而接收端的 `JSON.stringify(parsedObject)` 結果可能與原始位元組串不同（例如：多餘空白字元、Unicode 逸出方式、鍵排列順序差異），導致合法請求被拒絕，或簽名驗證邏輯無法真正保護安全。此外，NestJS 預設不保留原始請求體（`rawBody`），目前 `main.ts` 也未啟用。

**修復：**  
在 `main.ts` 啟用 `rawBody`，並在 guard 中使用 `request.rawBody`：

```typescript
// main.ts
const app = await NestFactory.create(AppModule, { rawBody: true });

// webhook-signature.guard.ts
canActivate(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<Request>();
  const rawBody = (request as any).rawBody as Buffer | undefined;
  if (!rawBody) {
    throw new UnauthorizedException('Raw body not available');
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
  // ...
}
```

---

### CR-03：SyncIndexService.updateStatus 缺少 clinicId 過濾條件（跨租戶資料污染）

**檔案：** `backend/src/doctor-toolbox-sync/services/sync-index.service.ts:141-158`

**問題：**  
`updateStatus` 只按 `crmPatientId` 更新，沒有加入 `clinicId` 條件。由於 `crmPatientId` 是 UUID，在不同診所間碰撞的機率理論上極低，但如果 `crmPatientId` 值可被外部控制（例如 Toolbox Webhook payload 中），攻擊者可能透過猜測或洩漏的 UUID 來污染其他診所的同步狀態。更嚴重的是，這違反了多租戶隔離的設計原則，一旦有 UUID 碰撞（無論是意外或惡意），跨租戶資料就會被修改。

**修復：**
```typescript
async updateStatus(
  clinicId: string,        // 新增必要參數
  crmPatientId: string,
  syncStatus: SyncStatus,
  errorMessage?: string | null,
): Promise<void> {
  const updateData: Partial<SyncPatientIndex> = {
    syncStatus,
    lastSyncAt: new Date(),
    ...(errorMessage !== undefined && { errorMessage }),
  };

  await this.syncIndexRepository.update(
    { clinicId, crmPatientId },  // 加入 clinicId 過濾
    updateData,
  );
}
```
並更新所有呼叫端（`sync-patient.service.ts:282,299`）傳入 `clinicId`。

---

### CR-04：fetchAllPatientsFromToolbox URL 拼接存在 clinicId 注入風險

**檔案：** `backend/src/doctor-toolbox-sync/services/bulk-export.service.ts:213`

**問題：**  
```typescript
const response = await fetch(`${toolboxUrl}/patients?clinicId=${clinicId}`);
```
`clinicId` 直接拼入 URL 查詢字串，未做 URL 編碼。雖然 `ClinicAuthMiddleware` 做了格式驗證（只允許字母、數字、`_`、`-`），但這個驗證在 `MigrationController` 端是針對 Header 或 Query 的輸入，不是針對 URL path 參數直接讀取的 `@Param('clinicId')`——後者完全不經過 middleware 的 `isValidClinicId` 驗證。若 `clinicId` 含特殊字元（例如 `&otherParam=value`），將產生非預期的 API 呼叫。

**修復：**
```typescript
const url = new URL(`${toolboxUrl}/patients`);
url.searchParams.set('clinicId', clinicId);
const response = await fetch(url.toString());
```

---

## HIGH 問題

### HI-01：MigrationProgressService.startProgress 不檢查是否已存在進行中的遷移

**檔案：** `backend/src/doctor-toolbox-sync/services/migration-progress.service.ts:32-49` / `bulk-export.service.ts:41-113`

**問題：**  
`startMigration` 直接呼叫 `startProgress` 建立新記錄，但 `migration_progress` 表對 `clinicId` 有 `UNIQUE` 約束（`@Index(['clinicId'], { unique: true })`）。若同一診所同時發起兩次 `POST /migrate/:clinicId` 請求，第二次將拋出資料庫唯一鍵衝突錯誤（`QueryFailedError`），此例外不會被正確捕獲，會導致 500 回應，且第一個遷移也可能被破壞。

**修復：**
```typescript
async startProgress(clinicId: string, totalPatients: number): Promise<MigrationProgress> {
  const existing = await this.getProgress(clinicId);
  if (existing && existing.status === 'in-progress') {
    throw new ConflictException(`診所 ${clinicId} 已有進行中的遷移`);
  }
  // 若有舊記錄則刪除後重建，或 upsert
  if (existing) {
    await this.progressRepository.delete({ clinicId });
  }
  // ... 原有建立邏輯
}
```

---

### HI-02：getClinicLogs 端點的 `@Req() req: any = {}` 預設值導致認證繞過

**檔案：** `backend/src/doctor-toolbox-sync/controllers/sync-audit.controller.ts:94`

**問題：**  
```typescript
async getClinicLogs(
  @Query('limit') limit: number = 1000,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Req() req: any = {},   // <-- 危險的預設值
```
`@Req() req: any = {}` 這個預設值意謂著如果 `req` 未被注入（理論上不應發生，但單元測試或框架邊緣情況可能觸發），`req.user` 將為 `undefined`，導致 `req.user.clinicId` 拋出 `TypeError: Cannot read properties of undefined`。更嚴重的是，在測試環境或被 mock 的情境下，`req = {}` 導致 `req.user.clinicId` 為 `undefined`，後續查詢將以 `undefined` 作為 `clinicId` 篩選條件，可能返回非預期資料。`@Req()` 在 NestJS 中不應有預設值。

**修復：**
```typescript
async getClinicLogs(
  @Query('limit') limit: number = 1000,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Req() req: any,   // 移除 = {} 預設值
): Promise<...>
```

---

### HI-03：resumeMigration 的 resumeIndex 計算存在整數解析錯誤

**檔案：** `backend/src/doctor-toolbox-sync/services/bulk-export.service.ts:137-139`

**問題：**
```typescript
const resumeIndex = progress.lastBatchId
  ? parseInt(progress.lastBatchId.split('-')[1]) * this.BATCH_SIZE
  : progress.processedPatients;
```
`lastBatchId` 格式為 `batch-{N}`，`split('-')[1]` 取批次號。但若 `lastBatchId` 格式不符（例如 `batch-` 後沒有數字、或為 `batch-abc`），`parseInt` 會返回 `NaN`，`NaN * 50 = NaN`，導致 `for` 迴圈的起始索引 `i = NaN`，迴圈條件 `NaN < toolboxPatients.length` 為 `false`，整個恢復迴圈直接跳過所有患者，靜默地標記遷移完成。

**修復：**
```typescript
let resumeIndex: number;
if (progress.lastBatchId) {
  const parts = progress.lastBatchId.split('-');
  const batchNum = parseInt(parts[1], 10);
  if (isNaN(batchNum)) {
    this.logger.warn(`無法解析 lastBatchId: ${progress.lastBatchId}，改用 processedPatients`);
    resumeIndex = progress.processedPatients;
  } else {
    resumeIndex = batchNum * this.BATCH_SIZE;
  }
} else {
  resumeIndex = progress.processedPatients;
}
```

---

### HI-04：RetryService 當 maxAttempts > 5 時 backoffDelays 索引越界導致延遲為 undefined

**檔案：** `backend/src/doctor-toolbox-sync/services/retry.service.ts:62`

**問題：**
```typescript
private readonly backoffDelays: number[] = [2000, 4000, 8000, 16000]; // 4 個元素
// ...
const delayMs = this.backoffDelays[attempt]; // attempt 可達 maxAttempts-2
```
`pushPatientToToolbox` 呼叫 `executeWithRetry(..., 5)`（5 次嘗試），當 `attempt = 4` 時，`backoffDelays[4]` 為 `undefined`，`delay(undefined)` 呼叫 `setTimeout(() => resolve(), undefined)` 會被瀏覽器/Node 解釋為 `setTimeout(..., 0)`，等同於無延遲，完全失去退避效果。

**修復：**
```typescript
private readonly backoffDelays: number[] = [2000, 4000, 8000, 16000, 32000];

// 在 executeWithRetry 中使用安全取值：
const delayMs = this.backoffDelays[attempt] ?? this.backoffDelays[this.backoffDelays.length - 1];
```

---

## MEDIUM 問題

### ME-01：queryByDateRange 無分頁上限，可能返回海量資料

**檔案：** `backend/src/doctor-toolbox-sync/services/sync-audit.service.ts:79-91`

**問題：**  
`queryByDateRange` 沒有 `take` 限制。`GET /sync/audit/clinic?startDate=2020-01-01&endDate=2026-01-01` 可一次返回數年的所有稽核日誌，對資料庫和記憶體造成潛在壓力。

**修復：**
```typescript
async queryByDateRange(
  clinicId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 5000,   // 加入限制
): Promise<SyncAuditLog[]> {
  return this.auditLogRepository.find({
    where: { clinicId, timestamp: Between(startDate, endDate) },
    order: { timestamp: 'DESC' },
    take: limit,
  });
}
```

---

### ME-02：getStats 端點的 `days` 參數未驗證，可接受負數或極大值

**檔案：** `backend/src/doctor-toolbox-sync/controllers/sync-audit.controller.ts:134-168`

**問題：**  
`@Query('days') days: number = 7` 沒有任何驗證。若傳入 `days=-365`，`startDate.setDate(startDate.getDate() + 365)` 會產生未來日期，`Between(futureDate, now)` 將返回空集合，靜默失敗。若傳入 `days=99999` 則可能觸發 ME-01 的海量查詢問題。

**修復：**
```typescript
@Get('stats')
async getStats(
  @Query('days') daysStr: string = '7',
  @Req() req: any,
) {
  const days = Math.min(Math.max(parseInt(daysStr, 10) || 7, 1), 365);
  // ...
}
```

---

### ME-03：SyncAuditLog 缺少複合索引，高頻查詢效能不足

**檔案：** `backend/src/common/entities/sync-audit-log.entity.ts:23-53`

**問題：**  
`queryByPatient`（常用路徑）和 `queryFailures` 使用 `(clinicId, patientId)` 和 `(clinicId, status, timestamp)` 組合查詢，但目前只有三個獨立的單欄索引（`clinicId`、`patientId`、`action`）。缺少複合索引時，高流量情境下這些查詢必須進行全表掃描加過濾，效能會隨資料量線性劣化。

**修復：**
```typescript
@Entity('sync_audit_logs')
@Index(['clinicId', 'patientId'])          // queryByPatient 路徑
@Index(['clinicId', 'status', 'timestamp']) // queryFailures 路徑
@Index(['clinicId', 'action'])              // queryByAction 路徑
export class SyncAuditLog { ... }
```

---

### ME-04：`ToolboxPatientDto.idNumber` 和 `phone` 標記為必填，但同步邏輯預期可為空

**檔案：** `backend/src/doctor-toolbox-sync/dto/webhook-payload.dto.ts:43-57` 與 `services/sync-patient.service.ts:145-149`

**問題：**  
DTO 中 `idNumber`（`@MinLength(1)`，非 `@IsOptional()`）和 `phone` 均為必填欄位。但 `detectConflict` 邏輯中：
```typescript
if (!crmPatient.idNumber || !toolboxData.idNumber) {
  return false;
}
```
明確處理 `idNumber` 為空的情況，顯示設計上允許 `idNumber` 不存在。DTO 驗證與業務邏輯不一致：合法的「無身份證號」患者資料將在入口被 ValidationPipe 拒絕，永遠無法同步。

**修復：**  
在 DTO 中將 `idNumber` 和 `phone` 加上 `@IsOptional()`：
```typescript
@IsOptional()
@IsString()
@MaxLength(50)
idNumber?: string;

@IsOptional()
@IsString()
@MaxLength(20)
phone?: string;
```

---

## LOW 問題

### LO-01：migration.controller.ts 使用未宣告的類型 `MigrationProgressDto`（編譯時風險）

**檔案：** `backend/src/doctor-toolbox-sync/controllers/migration.controller.ts:47,64,81`

**問題：**  
`MigrationProgressDto` 在第 120 行定義於同一檔案尾部，在函式簽名（第 47 行）中使用。TypeScript 雖然允許這樣做（宣告提升），但 `MigrationProgressDto` 沒有 class-validator 裝飾器，也沒有被 Swagger 的 `@ApiResponse` 標注，導致 API 文件缺失回應 schema，且與 `SyncAuditController` 中使用 Swagger 裝飾器的風格不一致。建議將 DTO 移至獨立的 `dto/` 目錄。

---

### LO-02：sync-monitoring.service.ts 的 catch 區塊 `error.message` 使用不安全

**檔案：** `backend/src/doctor-toolbox-sync/services/sync-monitoring.service.ts:54,98,149`

**問題：**
```typescript
} catch (error) {
  this.logger.error(`...錯誤=${error.message}`);
```
`error` 型別為 `unknown`，直接存取 `.message` 屬性在 TypeScript strict 模式下會產生型別錯誤，且若 `error` 不是 `Error` 實例（例如是字串或 `null`），會拋出 `TypeError`，掩蓋原始錯誤。

**修復：**
```typescript
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  this.logger.error(`...錯誤=${msg}`);
}
```

---

### LO-03：processBatch 中 webhookId 使用 Math.random() 生成，冪等性不可靠

**檔案：** `backend/src/doctor-toolbox-sync/services/bulk-export.service.ts:233`

**問題：**
```typescript
webhookId: `migration-${Date.now()}-${Math.random()}`,
```
`Math.random()` 不是密碼學安全的隨機數，在高並發情況下（同一毫秒內多個 `Date.now()` 相同）仍有極低碰撞機率。更重要的是，每次重試或恢復時，同一個 Toolbox 患者會得到不同的 `webhookId`，導致 `SyncPatientIndex` 中建立多筆冗餘記錄，破壞冪等性設計意圖。

**修復：**
```typescript
import { randomUUID } from 'crypto';

// 使用穩定的患者 ID 作為 migration webhookId，確保冪等性
webhookId: `migration-${clinicId}-${patient.id}`,
// 或：
webhookId: randomUUID(),
```

---

## 總結

| 嚴重度 | 數量 | 主要類型 |
|--------|------|----------|
| CRITICAL | 4 | 跨租戶授權漏洞、Webhook 簽名驗證缺陷、URL 注入 |
| HIGH | 4 | 認證繞過風險、遷移邏輯錯誤、退避延遲失效 |
| MEDIUM | 4 | 無界查詢、輸入驗證不一致、缺少複合索引 |
| LOW | 3 | 型別安全、程式碼組織、冪等性可靠性 |

**最優先修復順序：** CR-01（跨租戶授權）→ CR-03（updateStatus 無 clinicId 過濾）→ CR-02（Webhook 簽名）→ HI-02（req 預設值）→ HI-03（resumeIndex NaN）。

---

_審查日期：2026-04-20_  
_審查員：Claude (gsd-code-reviewer)_  
_深度：standard + 跨檔案路徑追蹤_
