# 測試策略 - Phase 1

> 版本：1.0
> 更新日期：2026-03-27
> 後端測試框架：Jest + ts-jest + supertest
> 前端測試框架：Vitest + Vue Test Utils

---

## 測試架構概覽

| 層級 | 框架 | 覆蓋率目標 | 範圍 |
|-----|------|----------|------|
| 後端單元 | Jest + ts-jest | 100% 函數/行/語句 | Service 業務邏輯 |
| 後端集成 | Jest + supertest | 90% 分支 | Controller 端點 |
| 前端單元 | Vitest | 80%+ | Vue 組件 |
| E2E | Playwright | 70% | 完整用戶流程 |

---

## Unit Tests

### 後端服務層測試

#### 測試檔案結構

```
backend/src/
  treatments/
    services/
      medical-order.service.spec.ts    # 醫令服務測試
      treatment-course.service.spec.ts  # 療程服務測試
  patients/
    services/
      patient-search.service.spec.ts   # 患者搜尋服務測試
```

#### 測試案例設計原則

每個 Service 方法需覆蓋：
1. **成功路徑**：正常輸入 → 預期結果
2. **邊界條件**：空值、最大值、最小值
3. **異常路徑**：無效輸入 → 拋出正確異常

### 範例：醫令服務測試

```typescript
describe('MedicalOrderService.createMedicalOrder', () => {
  // ✅ 成功路徑：建立有效醫令
  it('should create a medical order successfully', async () => {
    const dto: CreateMedicalOrderDto = {
      patientId: 'test-uuid',
      drugOrTreatmentName: '感冒藥',
      dosage: '500mg x 3',
      usageMethod: '口服',
      totalUsage: 5
    };
    const result = await service.createMedicalOrder(dto, 'clinic-uuid');
    expect(result.status).toBe('pending');
  });

  // ✅ 患者不存在：拋出 NotFoundException
  it('should throw NotFoundException when patient not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.createMedicalOrder(dto, clinicId))
      .rejects.toThrow(NotFoundException);
  });

  // ✅ 療程數 <= 0：拋出 BadRequestException
  it('should throw BadRequestException for zero totalUsage', async () => {
    const invalidDto = { ...dto, totalUsage: 0 };
    await expect(service.createMedicalOrder(invalidDto, clinicId))
      .rejects.toThrow(BadRequestException);
  });
});
```

### 範例：療程服務測試

```typescript
describe('TreatmentCourseService', () => {
  // ✅ 進度計算
  it('should calculate progress correctly', () => {
    const course = mockCourseWith3of10Completed();
    const progress = service.getProgress(course);
    expect(progress.progressPercent).toBe(30);
    expect(progress.completedSessions).toBe(3);
  });

  // ✅ 狀態轉換
  it('should complete course when all sessions done', async () => {
    const course = mockCourseAllCompleted();
    const result = await service.updateCourse(course.id, { status: 'completed' }, clinicId);
    expect(result.status).toBe('completed');
  });
});
```

---

## Integration Tests

### 後端集成測試

#### 測試結構

```
backend/src/
  patients/
    controllers/
      patient.controller.integration.spec.ts
  treatments/
    controllers/
      medical-order.controller.integration.spec.ts
      treatment-course.controller.integration.spec.ts
```

#### 測試策略

- 使用 `@nestjs/testing` 建立測試模組
- 使用 `supertest` 進行 HTTP 請求
- 使用 Mock Guard（`MockClinicContextGuard`）模擬認證，不依賴真實 JWT
- 使用 Mock Repository 隔離資料庫依賴

### 範例：醫令 Controller 集成測試

```typescript
describe('MedicalOrderController (integration)', () => {
  // ✅ POST /api/medical-orders 返回 201
  it('POST /api/medical-orders should return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/medical-orders')
      .send(validDto)
      .expect(201);
    expect(response.body.statusCode).toBe(201);
    expect(response.body.data.status).toBe('pending');
  });

  // ✅ 無效 DTO 返回 400 + 驗證錯誤
  it('POST with invalid DTO should return 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/medical-orders')
      .send({ patientId: 'invalid' })
      .expect(400);
    expect(response.body.errors).toBeDefined();
  });

  // ✅ 診所隔離驗證
  it('should only return orders for authenticated clinic', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/patients/test-patient/medical-orders')
      .expect(200);
    expect(response.body.data.every(o => o.clinicId === 'test-clinic')).toBe(true);
  });
});
```

---

## 執行測試

### 後端測試

```bash
# 進入後端目錄
cd backend

# 執行所有測試
npm test

# 執行特定測試檔案
npm test -- medical-order.service.spec.ts

# 執行特定測試案例
npm test -- -t "should create medical order"

# 生成覆蓋報告
npm test -- --coverage

# 監視模式（開發時）
npm test -- --watch

# 顯示詳細輸出
npm test -- --verbose
```

### 前端測試

```bash
# 進入前端目錄
cd frontend

# 執行所有單元測試
npm run test:unit

# 生成覆蓋報告
npm run test:unit -- --coverage

# 執行 E2E 測試
npm run test:e2e

# 監視模式（開發時）
npm run test:unit -- --watch
```

---

## 覆蓋目標

### 後端服務層：100%

涵蓋範圍：
- CRUD 操作（建立、讀取、更新、刪除）
- 狀態轉換驗證（合法 / 非法轉換）
- 業務規則檢查（唯一性、存在性、邏輯驗證）
- 邊界條件（0 值、最大值、空字串）

### 後端控制層：90%

涵蓋範圍：
- 所有端點覆蓋（GET、POST、PATCH、DELETE）
- 異常處理覆蓋（404、400、401、403）
- 不包括開發時輔助路由

### 前端組件：80%+

涵蓋範圍：
- 主要組件掛載測試
- 用戶互動模擬（點擊、表單輸入）
- API 調用模擬（axios mock）
- Props 傳遞與事件發射

### 整體覆蓋率：90%

Jest 配置（`jest.config.ts`）：

```typescript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

---

## Jest 配置說明

### 排除項目

以下檔案不計入覆蓋率：
- `*.entity.ts` — TypeORM 實體（僅定義）
- `*.module.ts` — NestJS 模組（DI 配置）
- `*.dto.ts` — DTO 類別（僅驗證裝飾器）
- `main.ts` — 應用程式入口

### 測試環境

- 使用 `ts-jest` 轉換 TypeScript
- `rootDir` 設定為 `src/` 目錄
- 排除 `dist/` 和 `node_modules/`

---

## 持續集成

### CI 流程（GitHub Actions）

```yaml
- name: 執行後端測試
  run: |
    cd backend
    npm ci
    npm test -- --coverage --ci

- name: 覆蓋率檢查
  run: |
    # 覆蓋率低於閾值時自動失敗
    # 配置見 jest.config.ts coverageThreshold
```

規則：
- 每次推送時自動運行測試
- 覆蓋率低於閾值時拒絕合併
- 失敗測試必須修復才能合併到主分支

---

## 調試測試

```bash
# 執行單一測試檔案
npm test -- medical-order.service.spec.ts

# 執行特定測試案例（-t 為正則）
npm test -- -t "should create medical order"

# 顯示詳細輸出
npm test -- --verbose

# 動態偵錯（Chrome DevTools）
node --inspect-brk=9229 node_modules/.bin/jest --runInBand

# 只執行失敗的測試
npm test -- --onlyFailures
```

---

## 測試資料管理

### Mock 工廠函數模式

```typescript
// 建立測試用患者
function createMockPatient(overrides?: Partial<Patient>): Patient {
  return {
    id: 'test-patient-id',
    idNumber: 'A123456789',
    name: 'Test Patient',
    clinicId: 'test-clinic-id',
    ...overrides
  };
}

// 建立測試用醫令
function createMockMedicalOrder(overrides?: Partial<MedicalOrder>): MedicalOrder {
  return {
    id: 'test-order-id',
    drugOrTreatmentName: '感冒藥',
    status: 'pending',
    usedCount: 0,
    totalUsage: 5,
    ...overrides
  };
}
```

---

*測試文檔版本：1.0 | Phase 1 完成於 2026-03-27*
