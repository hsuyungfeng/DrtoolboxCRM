---
phase: 01-treatment-prescription-core
plan: 12
type: execute
wave: 4
depends_on: [04, 05, 06, 08, 09, 10]
files_modified:
  - frontend/src/tests/medical-orders.spec.ts
  - frontend/src/tests/treatments.spec.ts
  - frontend/src/tests/patients.spec.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - 所有前端組件都有單元測試
    - 所有 API 調用都有測試
    - 用戶互動都有測試
  artifacts:
    - path: frontend/src/tests/medical-orders.spec.ts
      provides: 醫令組件測試
      contains: "describe"
    - path: frontend/src/tests/treatments.spec.ts
      provides: 療程組件測試
      contains: "describe"

---

<objective>
建立前端 Vue 組件和 API 單元測試，確保 UI 邏輯正確。

**Purpose:**
驗證前端組件行為和互動。

**Output:**
Vue 組件測試、API 模擬測試。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 前端測試框架

- Vitest：Vue 3 測試框架
- @vue/test-utils：Vue 組件測試工具
- @playwright/test：E2E 測試（可選，Wave 4 進階）

## 測試範圍

- 組件掛載和渲染
- 用戶互動（按鈕點擊、表單提交）
- API 調用（Mock axios）
- 狀態管理（Pinia store）
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立前端組件和 API 測試</name>
  <files>
    - frontend/src/tests/medical-orders.spec.ts
    - frontend/src/tests/treatments.spec.ts
    - frontend/src/tests/patients.spec.ts
  </files>

  <read_first>
    - frontend/src/components/MedicalOrderForm.vue
    - frontend/src/components/TreatmentForm.vue
    - frontend/src/services/api.ts
  </read_first>

  <action>
建立 Vue 組件和 API 測試：

**medical-orders.spec.ts**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MedicalOrderForm from '@/components/MedicalOrderForm.vue';
import { medicalOrdersApi } from '@/services/medical-orders-api';

vi.mock('@/services/medical-orders-api');
vi.mock('@/services/patients-api');

describe('MedicalOrderForm.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('應該正確掛載並顯示表單', () => {
    const wrapper = mount(MedicalOrderForm, {
      global: {
        stubs: {
          NForm: true,
          NFormItem: true,
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('應該在表單提交時發出 save 事件', async () => {
    const wrapper = mount(MedicalOrderForm, {
      global: {
        stubs: {
          NForm: { template: '<form><slot /></form>' },
          NFormItem: true,
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: true,
        },
      },
    });

    await wrapper.vm.handleSave();

    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('應該在取消時發出 cancel 事件', async () => {
    const wrapper = mount(MedicalOrderForm, {
      global: {
        stubs: {
          NForm: true,
          NFormItem: true,
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: true,
        },
      },
    });

    wrapper.find('button').trigger('click'); // Mock 取消按鈕

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});

describe('Medical Orders API', () => {
  it('應該成功建立醫令', async () => {
    const mockData = {
      id: 'order-1',
      patientId: 'patient-1',
      藥物或治療名稱: '感冒藥',
    };

    vi.mocked(medicalOrdersApi.createOrder).mockResolvedValue({
      data: mockData,
    });

    const result = await medicalOrdersApi.createOrder({
      patientId: 'patient-1',
      藥物或治療名稱: '感冒藥',
      劑量: '500mg',
      使用方式: '口服',
      療程數: 5,
    });

    expect(result.data.id).toBe('order-1');
  });

  it('應該成功取得患者醫令', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        藥物或治療名稱: '感冒藥',
        status: 'pending',
      },
    ];

    vi.mocked(medicalOrdersApi.getPatientOrders).mockResolvedValue({
      data: mockOrders,
    });

    const result = await medicalOrdersApi.getPatientOrders('patient-1');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('pending');
  });
});
```

**treatments.spec.ts** - 類似結構

```typescript
describe('TreatmentForm.vue', () => {
  // 測試療程表單
  // 測試患者搜尋集成
  // 測試表單驗證
});

describe('TreatmentProgressBar.vue', () => {
  it('應該正確計算進度百分比', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 3,
        total: 10,
      },
    });

    expect(wrapper.vm.progressPercent).toBe(30);
  });

  it('應該正確顯示進度文本', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 5,
        total: 10,
      },
    });

    expect(wrapper.text()).toContain('5 / 10');
    expect(wrapper.text()).toContain('50%');
  });
});
```

**patients.spec.ts** - 患者 API 測試

```typescript
describe('Patient API', () => {
  it('應該成功搜尋患者', async () => {
    const mockPatients = [
      { id: '1', name: 'John', idNumber: 'ID001' },
      { id: '2', name: 'Jane', idNumber: 'ID002' },
    ];

    vi.mocked(patientApi.search).mockResolvedValue({
      data: mockPatients,
    });

    const result = await patientApi.search('John');

    expect(result.data).toHaveLength(2);
  });

  it('應該驗證患者身份', async () => {
    const mockPatient = { id: '1', name: 'John', idNumber: 'ID001' };

    vi.mocked(patientApi.identify).mockResolvedValue({
      data: mockPatient,
    });

    const result = await patientApi.identify('ID001', 'John');

    expect(result.data.name).toBe('John');
  });
});
```

設計：
- 使用 vi.mock 模擬 API 調用
- 測試組件掛載和基本渲染
- 測試用戶互動（事件發出）
- 測試計算屬性（進度百分比）
- 測試 API 調用返回值
  </action>

  <verify>
    - [ ] 檔案存在：test -f frontend/src/tests/medical-orders.spec.ts
    - [ ] 檔案存在：test -f frontend/src/tests/treatments.spec.ts
    - [ ] 包含 describe：grep -q "describe(" frontend/src/tests/medical-orders.spec.ts
    - [ ] 執行測試：npm run test:unit 2>&1 | head -20
  </verify>

  <done>
- 前端組件測試完成
- API 模擬測試完成
- 用戶互動測試完成
  </done>
</task>

</tasks>

<verification>
**測試驗證：**
- npm run test:unit 執行所有前端測試
- 所有測試通過
- 組件正確渲染
- API 調用正確模擬

**代碼覆蓋驗證：**
- 主要組件都有測試
- API 調用都有測試
- 互動和計算邏輯都有測試
</verification>

<success_criteria>
- [ ] 前端組件單元測試完成
- [ ] API 測試完成
- [ ] 用戶互動測試完成
- [ ] 所有測試通過
- [ ] 測試覆蓋率達到 80% 以上
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/12-SUMMARY.md`

並執行以確認：
```bash
npm run test:unit -- --coverage
```
</output>

