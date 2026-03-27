# Doctor CRM 項目改進計劃

**制定日期**：2026年2月10日
**版本**：1.0
**優先方向**：數據安全與核心功能穩定性
**基於分析**：Deepseekplan.md、progress.md

---

## 一、項目現狀評估

### 1.1 已完成功能（完成度 96%）

| 模塊 | 狀態 | 說明 |
|------|------|------|
| 患者管理 (Patients) | ✅ 完成 | 完整 CRUD API + 前端界面 |
| 療程管理 (Treatments) | ✅ 完成 | 療程 + 療次管理完整實現 |
| 員工管理 (Staff) | ✅ 完成 | 角色系統 + 分配機制 |
| 分潤管理 (Revenue) | ✅ 完成 | 三種分潤算法 + 事件驅動 |
| 前端界面 | ✅ 完成 | Vue 3 四大管理頁面 |
| Docker 部署 | ✅ 完成 | 前後端容器化配置 |

### 1.2 技術架構

```
後端：NestJS 11.x + TypeORM + SQLite
前端：Vue 3 + TypeScript + Naive UI
部署：Docker + docker-compose
```

---

## 二、問題清單與風險評估

### 2.1 高風險問題（P0 - 立即修復）

#### 問題 1：分潤計算浮點數精度問題
- **位置**：`backend/src/revenue/services/revenue-calculator.service.ts:133-230`
- **風險**：金額計算可能產生誤差（如 1000/3 = 333.333...）
- **影響**：財務數據不準確，可能導致法律糾紛
- **解決方案**：使用 decimal.js 庫進行精確計算

#### 問題 2：事務隔離級別未指定
- **位置**：`backend/src/revenue/services/revenue-adjustment.service.ts:56-75`
- **風險**：併發操作可能導致數據不一致
- **影響**：髒讀、更新丟失、不可重複讀
- **解決方案**：設置 SERIALIZABLE 隔離級別

#### 問題 3：缺少樂觀鎖機制
- **位置**：所有實體更新操作
- **風險**：同時修改同一記錄時互相覆蓋
- **影響**：數據完整性受損
- **解決方案**：為核心實體添加 @VersionColumn()

#### 問題 4：測試覆蓋率極低
- **現狀**：約 5% 覆蓋率
- **風險**：代碼變更可能引入未被發現的 bug
- **影響**：系統穩定性難以保證
- **解決方案**：補充單元測試至 60% 覆蓋率

### 2.2 中等風險問題（P1 - 本週修復）

| 問題 | 風險 | 解決方案 |
|------|------|----------|
| 認證流程使用模擬數據 | 安全漏洞 | 實現 JWT 認證 API |
| 缺少環境變量配置 | 部署困難 | 創建 .env 模板文件 |
| 數據庫遷移腳本缺失 | 生產環境風險 | 創建 TypeORM 遷移 |
| 軟刪除邏輯不統一 | 維護困難 | 統一使用 status="deleted" |

### 2.3 低風險問題（P2 - 下週修復）

| 問題 | 解決方案 |
|------|----------|
| 缺少 CI/CD 配置 | 創建 GitHub Actions 工作流 |
| 項目文檔不完整 | 創建 README 和部署指南 |
| 前端缺少詳情頁面 | 開發患者/療程/員工詳情頁 |

---

## 三、改進實施計劃

### Phase 1：數據安全與穩定性（2-3 天）

#### 1.1 分潤計算精度修復

**步驟**：
```bash
# 1. 安裝 decimal.js
cd /home/hsu/CRMapp/doctor-crm/backend
npm install decimal.js
npm install -D @types/decimal.js
```

**代碼修改**：
```typescript
// revenue-calculator.service.ts
import Decimal from 'decimal.js';

// 修改計算方法
private calculateAmountByRule(...): number {
  const baseAmount = new Decimal(treatment.totalPrice);

  switch (rule.ruleType) {
    case 'percentage':
      const percentage = new Decimal(rulePayload.percentage);
      return baseAmount.mul(percentage).div(100).toNumber();
    case 'fixed':
      return new Decimal(rulePayload.amount).toNumber();
    // ...
  }
}
```

#### 1.2 事務隔離與樂觀鎖

**步驟**：
1. 為核心實體添加 version 欄位
2. 設置事務隔離級別
3. 添加鎖定記錄保護

**代碼修改**：
```typescript
// 實體添加版本控制
@Entity()
export class RevenueRecord {
  @VersionColumn()
  version: number;

  // ...
}

// 服務層設置隔離級別
const queryRunner = dataSource.createQueryRunner();
await queryRunner.startTransaction("SERIALIZABLE");
```

#### 1.3 診所隔離驗證增強

**修改文件**：`clinic-auth.middleware.ts`

**增強內容**：
- 驗證 clinicId 格式
- 添加 clinicId 存在性檢查（可選）
- 增加日誌記錄

---

### Phase 2：測試與品質保證（2-3 天）

#### 2.1 單元測試補充

**新增測試文件**：
- `revenue-calculator.service.spec.ts`
- `revenue-adjustment.service.spec.ts`
- `treatment-session.service.spec.ts`

**測試覆蓋重點**：
- 三種分潤算法正確性
- 邊界值（0%、100%、負數、超大數值）
- 異常場景處理
- 事務回滾驗證

#### 2.2 E2E 測試完善

**測試場景**：
1. 完整分潤計算流程
2. 財務鎖定與解鎖
3. 調整單審核流程
4. 診所隔離驗證

---

### Phase 3：認證與配置（1-2 天）

#### 3.1 JWT 認證實現

**新增模塊**：
```
backend/src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── jwt.strategy.ts
├── dto/
│   ├── login.dto.ts
│   └── register.dto.ts
└── guards/
    └── jwt-auth.guard.ts
```

#### 3.2 環境變量配置

**創建文件**：`.env.example`
```env
# 應用配置
NODE_ENV=development
PORT=3000

# 數據庫配置
DATABASE_PATH=./database.sqlite

# JWT 配置
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 前端配置
VITE_API_BASE_URL=http://localhost:3000/api
```

---

### Phase 4：部署與 CI/CD（1-2 天）

#### 4.1 GitHub Actions 工作流

**創建文件**：`.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install Backend Dependencies
        run: cd backend && npm ci
      - name: Run Tests
        run: cd backend && npm run test
      - name: Run Lint
        run: cd backend && npm run lint
      - name: Build
        run: cd backend && npm run build
```

#### 4.2 數據庫遷移

**配置命令**：
```json
// package.json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/config/database.config.ts",
    "migration:run": "npm run typeorm -- migration:run -d src/config/database.config.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d src/config/database.config.ts"
  }
}
```

---

### Phase 5：文檔與優化（1 天）

#### 5.1 項目文檔

**創建文件**：
- `README.md`：項目概述、快速開始、技術棧
- `DEPLOYMENT.md`：生產環境部署指南
- `API.md`：API 端點說明（補充 Swagger）

---

## 四、驗證方法

### 4.1 Phase 1 驗證

```bash
# 編譯檢查
cd /home/hsu/CRMapp/doctor-crm/backend
npm run build

# 啟動服務測試
npm run start:dev

# 測試分潤計算 API
curl -X POST http://localhost:3000/api/revenue-records/calculate/treatment/1 \
  -H "X-Clinic-Id: clinic_001"
```

### 4.2 Phase 2 驗證

```bash
# 執行單元測試
npm run test

# 執行 E2E 測試
npm run test:e2e

# 查看覆蓋率報告
npm run test:cov
```

### 4.3 整體驗證

```bash
# Docker 構建測試
cd /home/hsu/CRMapp/doctor-crm
docker-compose up --build

# 訪問服務
# 後端 API：http://localhost:3000/api
# 前端界面：http://localhost:8080
# API 文檔：http://localhost:3000/api/docs
```

---

## 五、時間表與里程碑

| 階段 | 開始日期 | 結束日期 | 交付物 |
|------|----------|----------|--------|
| Phase 1 | 2026-02-10 | 2026-02-12 | 數據安全修復完成 |
| Phase 2 | 2026-02-13 | 2026-02-15 | 測試覆蓋率 60% |
| Phase 3 | 2026-02-16 | 2026-02-17 | JWT 認證 + 環境配置 |
| Phase 4 | 2026-02-18 | 2026-02-19 | CI/CD 流程就緒 |
| Phase 5 | 2026-02-20 | 2026-02-20 | 文檔完善 |

---

## 六、風險控制

### 6.1 技術風險

| 風險 | 概率 | 影響 | 緩解措施 |
|------|------|------|----------|
| decimal.js 性能影響 | 低 | 中 | 僅在財務計算使用 |
| 樂觀鎖衝突頻繁 | 中 | 低 | 添加重試機制 |
| 測試時間超預期 | 中 | 中 | 優先測試核心功能 |

### 6.2 回滾方案

每個 Phase 完成後創建 Git 標籤：
```bash
git tag -a v0.1.0-phase1 -m "Phase 1: Data Security"
git tag -a v0.1.0-phase2 -m "Phase 2: Testing"
# ...
```

---

## 七、成功指標

| 指標 | 目標值 | 驗證方法 |
|------|--------|----------|
| 分潤計算精度 | 小數點後 4 位 | 單元測試驗證 |
| 測試覆蓋率 | ≥ 60% | Jest 覆蓋率報告 |
| 構建成功率 | 100% | CI/CD 報告 |
| 編譯錯誤 | 0 | TypeScript 編譯 |
| Lint 錯誤 | 0 | ESLint 報告 |

---

**文件創建日期**：2026年2月10日
**最後更新**：2026年2月10日
**負責人**：Claude AI 協助制定
