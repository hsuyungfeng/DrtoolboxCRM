# 測試模式

**分析日期：** 2026-03-26

## 測試框架

**測試運行器：**
- Jest v30.0.0
- 配置文件：`backend/package.json` 中的 `jest` 配置字段
- 轉換器：`ts-jest` v29.2.5

**斷言庫：**
- Jest 內置的 `expect()` 函數

**測試運行命令：**
```bash
npm run test              # 運行所有測試
npm run test:watch       # 監視模式，文件變更時重新運行
npm run test:cov         # 覆蓋率報告
npm run test:debug       # 調試模式
npm run test:e2e         # E2E 測試 (使用 jest-e2e.json 配置)
```

## 測試文件組織

**文件位置：**
- **單元測試：** 與源代碼位於同一目錄，使用 `.spec.ts` 後綴
  - `src/patients/services/patient.service.spec.ts`
  - `src/points/controllers/points.controller.spec.ts`
  - `src/treatments/services/ppf-calculation.service.spec.ts`
- **E2E 測試：** 在 `test/` 目錄，使用 `.e2e-spec.ts` 後綴
  - `test/app.e2e-spec.ts`
  - `test/e2e/api.e2e-spec.ts`
- **前端 E2E 測試：** 在 `frontend/tests/` 目錄，使用 Playwright
  - `frontend/tests/app.spec.ts`

**命名規則：**
- 測試文件與源文件同名，僅後綴不同
- 示例：`patient.service.ts` → `patient.service.ts.spec`

**Jest 配置：** `backend/package.json`
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

## 測試結構

**Suite 組織：**
```typescript
describe("PointsController", () => {
  let controller: PointsController;
  let service: jest.Mocked<PointsService>;

  beforeEach(async () => {
    // 設置測試模塊
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        {
          provide: PointsService,
          useValue: mockPointsService,
        },
      ],
    }).compile();

    controller = module.get<PointsController>(PointsController);
    service = module.get<jest.Mocked<PointsService>>(PointsService);
  });

  describe("awardPoints", () => {
    it("應該成功獎勵點數", async () => {
      // Arrange
      const createDto = new CreatePointsTransactionDto();
      createDto.customerId = "patient-001";
      service.awardPoints.mockResolvedValue(mockTransaction as PointsTransaction);

      // Act
      const result = await controller.awardPoints(createDto);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(service.awardPoints).toHaveBeenCalledWith(
        "patient-001",
        100,
        "referral",
        "clinic-001",
        undefined,
      );
    });
  });
});
```

**模式分析：**
- **Setup 階段：** `beforeEach()` 為每個測試初始化模塊和依賴
- **三段式命名：** Arrange（準備）→ Act（執行）→ Assert（驗證）
- **清晰的變量命名：** `mockClinicId`, `mockTransaction`, `mockBalance` 表示測試數據
- **中文描述：** 測試描述使用繁體中文，便於理解業務邏輯

## 模擬

**框架：** Jest 內置的 `jest.fn()` 和 `jest.Mocked<T>`

**模擬模式：**
```typescript
// 服務級別模擬
const mockPointsService = {
  awardPoints: jest.fn(),
  redeemPoints: jest.fn(),
  getBalance: jest.fn(),
  getTransactionHistory: jest.fn(),
};

// 類型化模擬
let service: jest.Mocked<PointsService>;
service = module.get<jest.Mocked<PointsService>>(PointsService);

// 設置模擬返回值
service.awardPoints.mockResolvedValue(mockTransaction as PointsTransaction);

// 驗證模擬調用
expect(service.awardPoints).toHaveBeenCalledWith(
  customerId,
  100,
  "referral",
  clinicId,
  undefined,
);
```

**模擬什麼：**
- 數據庫訪問 (Repository)
- 外部服務調用
- 需要注入的依賴
- 基礎設施層 (Logger, EventEmitter)

**什麼不要模擬：**
- 被測函數本身的邏輯
- 關鍵的業務驗證規則
- 錯誤處理路徑（應該測試真實的異常拋出）

## Fixture 和工廠

**測試數據：**
```typescript
// 在測試文件頂部定義常量
const mockClinicId = "clinic-001";
const mockCustomerId = "patient-001";

const mockBalance: Partial<PointsBalance> = {
  id: "balance-001",
  customerId: mockCustomerId,
  customerType: "patient",
  balance: 500,
  totalEarned: 1000,
  totalRedeemed: 500,
  clinicId: mockClinicId,
};

const mockTransaction: Partial<PointsTransaction> = {
  id: "tx-001",
  customerId: mockCustomerId,
  type: "earn_referral",
  amount: 100,
  balance: 600,
  source: "referral",
  clinicId: mockClinicId,
};
```

**Fixture 位置：**
- 在測試文件頂部為簡單場景定義
- 對於複雜的多文件共享，考慮在 `test/fixtures/` 或 `test/helpers/` 目錄創建工廠

**命名約定：**
- 前綴 `mock` 表示模擬數據：`mockTransaction`, `mockBalance`, `mockClinicId`

## 覆蓋率

**目標：** 不強制執行（未配置覆蓋率門檻）

**查看覆蓋率：**
```bash
npm run test:cov
# 生成報告在 backend/coverage/ 目錄
```

**覆蓋率位置：** `backend/coverage/`
- 包含 HTML 報告和 LCOV 格式的詳細數據
- 集成到 CI/CD 流程中進行趨勢追蹤

## 測試類型

**單元測試：**
- **範圍：** 測試單一函數或類的邏輯
- **隔離方式：** 依賴通過模擬注入
- **位置：** `src/**/*.spec.ts`
- **覆蓋內容：**
  - DTO 驗證邏輯（在 `*-*.dto.spec.ts`）
  - 實體方法和屬性（在 `*.entity.spec.ts`）
  - 服務業務邏輯（在 `*.service.spec.ts`）
  - 控制器請求處理（在 `*.controller.spec.ts`）

**集成測試：**
- **框架：** 使用 NestJS 的 `Test.createTestingModule()`
- **範圍：** 測試模塊間的交互
- **示例：** 控制器與服務的協作，DTO 驗證到服務調用的完整流程
- **位置：** `src/**/*.spec.ts` （控制器測試級別）

**E2E 測試：**
- **後端 E2E：**
  - 框架：Jest + Supertest
  - 配置：`test/jest-e2e.json`
  - 位置：`test/*.e2e-spec.ts`, `test/e2e/*.e2e-spec.ts`
  - 方式：啟動完整應用，通過 HTTP 進行測試

- **前端 E2E：**
  - 框架：Playwright v1.58.2
  - 配置：`frontend/playwright.config.ts`
  - 位置：`frontend/tests/*.spec.ts`
  - 運行命令：
    ```bash
    npm run test:e2e         # 後台運行
    npm run test:e2e:ui      # UI 模式
    ```
  - 特性：
    - 基礎 URL：`http://localhost:5173`
    - 失敗時自動截圖：`screenshot: 'only-on-failure'`
    - 失敗時記錄：`trace: 'on-first-retry'`
    - 平行執行：`fullyParallel: true`
    - 重試：CI 環境下 2 次重試

## 常見模式

**異步測試：**
```typescript
// 使用 async/await
it("應該成功獎勵點數", async () => {
  service.awardPoints.mockResolvedValue(mockTransaction);

  const result = await controller.awardPoints(createDto);

  expect(result).toEqual(mockTransaction);
});

// 測試承諾拒絕
it("應該拋出異常：金額無效", async () => {
  service.awardPoints.mockRejectedValue(
    new BadRequestException("金額必須大於 0")
  );

  await expect(controller.awardPoints(invalidDto)).rejects.toThrow(
    BadRequestException
  );
});
```

**錯誤測試：**
```typescript
describe("validateStaffAssignments", () => {
  it("應該拋出異常：空分配數組", () => {
    const assignments: { ppfPercentage: Decimal }[] = [];

    expect(() => service.validateStaffAssignments(assignments)).toThrow(
      BadRequestException
    );
  });

  it("應該拋出異常：分配總計 < 100%", () => {
    const assignments = [
      { ppfPercentage: new Decimal("50") },
      { ppfPercentage: new Decimal("40") },
    ];

    expect(() => service.validateStaffAssignments(assignments)).toThrow(
      BadRequestException
    );
  });
});
```

**驗證測試（DTO）：**
```typescript
describe("CreatePointsTransactionDto", () => {
  describe("驗證規則", () => {
    it("應該通過有效的 DTO", async () => {
      const dto = new CreatePointsTransactionDto();
      dto.customerId = "patient-001";
      dto.customerType = "patient";
      dto.amount = 100;
      dto.source = "referral";
      dto.clinicId = "clinic-001";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("customerId 不能為空", async () => {
      const dto = new CreatePointsTransactionDto();
      // customerId 未設置

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'customerId')).toBe(true);
    });
  });
});
```

**控制器測試：**
```typescript
// 驗證服務被正確調用
it("應該支持推薦 ID", async () => {
  const createDto = new CreatePointsTransactionDto();
  createDto.referralId = "ref-123";

  service.awardPoints.mockResolvedValue(mockTransaction);

  await controller.awardPoints(createDto);

  expect(service.awardPoints).toHaveBeenCalledWith(
    mockCustomerId,
    100,
    "referral",
    mockClinicId,
    "ref-123",  // 驗證引薦 ID 被傳遞
  );
});
```

## 測試覆蓋情況

**廣泛覆蓋的領域：**
- 積分系統：`src/points/` - 超過 50 個測試
  - 控制器、服務、實體、DTO 驗證
- 療程系統：`src/treatments/` - 超過 40 個測試
  - 療程課程、會話、模板相關邏輯
- 特殊計算：`ppf-calculation.service.spec.ts`
  - 複雜的員工分潤百分比驗證（邊界情況測試）

**總測試數：** 超過 1200 個測試用例（來自 describe/it 統計）

**未被充分測試的領域：**
- 患者服務 (PatientService)：無專用測試文件
- 認證流程：測試不完整
- 中間件：`ClinicAuthMiddleware` 無專用測試
- 過濾器：異常過濾器無單元測試

## 測試運行和調試

**本地開發：**
```bash
# 監視模式 - 文件變更時自動運行
npm run test:watch

# 特定文件的監視
npm run test:watch -- patient.service.spec

# 特定 Suite 的監視
npm run test:watch -- --testNamePattern="獎勵點數"

# 調試模式（連接到調試器）
npm run test:debug
```

**CI 環境：**
- E2E 測試：使用 `process.env.CI ? 1 : undefined` workers（單進程）
- E2E 重試：CI 環境下設置 2 次重試
- 並行化：否（CI 環境下為了穩定性禁用平行執行）

---

*測試分析：2026-03-26*
