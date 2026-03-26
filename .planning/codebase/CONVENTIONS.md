# 編程規約

**分析日期：** 2026-03-26

## 命名規則

**文件命名：**
- 控制器：`{domain}.controller.ts` (例如：`patient.controller.ts`, `points.controller.ts`)
- 服務：`{domain}.service.ts` (例如：`patient.service.ts`, `points.service.ts`)
- 實體/模型：`{domain}.entity.ts` (例如：`patient.entity.ts`, `points-transaction.entity.ts`)
- DTO（數據傳輸對象）：`{action}-{domain}.dto.ts` (例如：`create-patient.dto.ts`, `update-patient.dto.ts`)
- 模塊：`{domain}.module.ts` (例如：`patients.module.ts`, `points.module.ts`)
- 測試文件：`{name}.spec.ts` (例如：`patient.service.spec.ts`)
- E2E 測試：`{name}.e2e-spec.ts` (例如：`api.e2e-spec.ts`)
- 過濾器：`{name}.filter.ts` (例如：`http-exception.filter.ts`)
- 守衛：`{name}.guard.ts` (例如：`jwt-auth.guard.ts`)
- 策略：`{name}.strategy.ts` (例如：`jwt.strategy.ts`)
- 事件：`{action}.event.ts` (例如：`treatment-completed.event.ts`)

**函數命名：**
- 使用駝峰式命名法：`async create(dto: CreatePatientDto): Promise<Patient>`
- 動詞開頭的方法：`create`, `update`, `remove`, `find`, `findOne`, `findAll`
- 布爾值方法：`isActive`, `hasPermission`, `validate`
- 異步方法：均使用 `async` 關鍵字，返回 `Promise<T>`

**變量命名：**
- 常量：全大寫加下劃線：`const DEFAULT_PAGE_SIZE = 20`
- 私有屬性：駝峰式前綴 `private`：`private readonly logger = new Logger(...)`
- 公開屬性：駝峰式：`public patientName: string`
- 模擬對象：前綴 `mock`：`mockClinicId`, `mockTransaction`

**類型命名：**
- 接口：前綴 `I`：`interface JwtPayload`, `interface ApiResponse`, `interface CreateAuditLogDto`
- 類型別名：帕斯卡式：`type UserRole = 'admin' | 'doctor' | 'staff'`
- 枚舉：帕斯卡式：`enum AuditAction { CREATE, UPDATE, DELETE }`
- DTO 類：後綴 `Dto`：`CreatePatientDto`, `UpdatePatientDto`, `RedeemPointsDto`
- 實體類：後綴 `Entity`：`PatientEntity`, `PointsTransactionEntity`

## 代碼風格

**格式化工具：**
- Prettier v3.4.2
- ESLint v9.18.0 配合 `@typescript-eslint` v8.20.0

**ESLint 規則配置：** `backend/eslint.config.mjs`
- 啟用 TypeScript 推薦規則集
- 禁用 `@typescript-eslint/no-explicit-any`
- 警告 `@typescript-eslint/no-floating-promises`
- 警告 `@typescript-eslint/no-unsafe-argument`
- Prettier 集成啟用，行尾設為 `auto`

**TypeScript 編譯器選項：**
- 目標：`ES2023`
- 模塊解析：`nodenext`
- 嚴格模式：`strictNullChecks: true`
- 強制文件大小寫一致：`forceConsistentCasingInFileNames: true`
- 不強制隱式 any：`noImplicitAny: false`

**代碼格式化：**
- 縮進：2 個空格（Prettier 默認）
- 行長：80 字符（Prettier 默認）
- 引號：單引號優先
- 尾逗號：根據 Prettier 配置

**運行格式化和檢查：**
```bash
npm run lint          # ESLint 檢查和修復
npm run format        # Prettier 格式化
```

## 導入組織

**導入順序：**
1. NestJS 核心模塊 (`@nestjs/common`, `@nestjs/core`)
2. 裝飾器和依賴注入 (`@nestjs/platform-express`, `@nestjs/typeorm`)
3. 外部庫 (`typeorm`, `passport`, `bcrypt`)
4. 類驗證和轉換 (`class-validator`, `class-transformer`)
5. 相對導入 (`../services`, `../entities`, `../dto`)

**示例：**
```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Patient } from "../entities/patient.entity";
import { CreatePatientDto } from "../dto/create-patient.dto";
import { UpdatePatientDto } from "../dto/update-patient.dto";
```

**路徑別名：**
- 前端：`@/` 映射至 `src/`（在 `vite.config.ts` 配置）

## 錯誤處理

**策略：**
- 使用 NestJS 內置的 HTTP 異常類：`BadRequestException`, `NotFoundException`, `ConflictException`, `UnauthorizedException`
- 所有 HTTP 異常都通過統一的過濾器 `HttpExceptionFilter` 和 `AllExceptionsFilter` 處理
- 過濾器位置：`src/common/filters/`

**模式：**
```typescript
// 驗證失敗
if (!patient) {
  throw new NotFoundException(`Patient with ID ${id} not found`);
}

// 業務邏輯違反
throw new BadRequestException("獎勵點數必須大於 0");

// 衝突狀態
throw new ConflictException("Optimistic lock failed");

// 權限問題
throw new UnauthorizedException("無效的權杖");
```

**錯誤響應格式：** 在 `src/common/interfaces/api-error-response.interface.ts` 中定義
- `statusCode`: HTTP 狀態碼
- `message`: 錯誤信息
- `errorCode`: 應用自定義錯誤碼 (例如：`BAD_REQUEST`, `NOT_FOUND`, `VALIDATION_ERROR`)
- `timestamp`: ISO 時間戳
- `path`: 請求路徑
- `details`: 額外詳情
- `errors`: 驗證錯誤數組

## 日誌記錄

**框架：** NestJS 內置 `Logger`

**模式：**
```typescript
private readonly logger = new Logger(PointsService.name);

// 記錄信息
this.logger.log("用戶登入成功");

// 記錄警告
this.logger.warn("配額不足");

// 記錄調試信息
this.logger.debug("詳細的調試信息");

// 記錄錯誤
this.logger.error("發生錯誤", error);
```

**何時記錄：**
- 關鍵操作：用戶認證、數據修改、支付交易
- 異常情況：驗證失敗、資源衝突、系統異常
- 性能監控：長時間運行的操作
- 決不在：循環中的每次迭代、高頻方法調用

## 注釋

**何時添加注釋：**
- 複雜的業務邏輯
- 非顯而易見的算法
- 為何做出特定技術決策

**JSDoc/TSDoc 模式：**
```typescript
/**
 * 計算療程淨收入（扣除員工分潤）
 * @param coursePrice - 療程總價
 * @param staffAssignments - 員工分配數組
 * @returns 診所淨收入
 */
async calculateNetIncome(
  coursePrice: Decimal,
  staffAssignments: StaffAssignment[]
): Promise<Decimal>
```

**控制器方法文檔：**
```typescript
/**
 * 獎勵點數
 * POST /points/award
 */
@Post("award")
async awardPoints(
  @Body() createDto: CreatePointsTransactionDto,
): Promise<PointsTransaction>
```

## 函數設計

**大小：**
- 單一職責：一個函數做一件事
- 目標：不超過 50 行代碼
- 深度嵌套層級不超過 3 層

**參數：**
- 優先使用 DTO 而不是單個參數
- 最多 3 個參數，超過則使用對象
- 示例：
```typescript
// 好的做法
async create(createPatientDto: CreatePatientDto): Promise<Patient>

// 避免這樣做
async create(name: string, email: string, phone: string, ...): Promise<Patient>
```

**返回值：**
- 異步操作返回 `Promise<T>`
- 可能為 null 的返回值使用 `T | null`
- 集合返回 `T[]` 或 `Promise<T[]>`
- 分頁結果返回分頁對象：`{ items: T[], total: number, page: number }`

## 模塊設計

**導出規則：**
- 只導出必要的服務和控制器
- 隱藏實現細節（私有服務、內部類）
- 在模塊層級進行 exports 控制

**示例：** `src/points/points.module.ts`
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([...])],
  controllers: [PointsController],
  providers: [PointsService, PointsConfigService, PointsTransactionService],
  exports: [PointsService], // 只導出主服務
})
export class PointsModule {}
```

**條形文件使用：**
- 在 `index.ts` 中聚合導出
- 簡化導入路徑：`import { PatientService } from '../services'` 而不是 `import { PatientService } from '../services/patient.service'`

## 通用跨切面

**認證：**
- 使用 JWT 策略：`JwtStrategy` 在 `src/auth/strategies/jwt.strategy.ts`
- 守衛：`JwtAuthGuard` 在 `src/auth/guards/jwt-auth.guard.ts`
- 應用在控制器級別：`@UseGuards(JwtAuthGuard)`

**驗證：**
- 使用 `class-validator` 在 DTO 中驗證
- 示例：
```typescript
@IsString()
@Length(1, 255)
name: string;

@IsEmail()
email?: string;
```

**多租戶隔離：**
- 所有實體必須包含 `clinicId` 字段
- 中間件 `ClinicAuthMiddleware` 在 `src/common/middlewares/clinic-auth.middleware.ts` 強制驗證
- API 請求通過 header `X-Clinic-Id` 或查詢參數傳遞 clinicId

---

*規約分析：2026-03-26*
