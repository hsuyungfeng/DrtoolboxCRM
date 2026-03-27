# Treatments UI & PPF 分潤計算引擎 實施計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 實現療程管理 CRUD 頁面 + 自動分潤計算引擎

**Architecture:**
- Backend: Service Layer (TreatmentsService + RevenueCalculationService) + Controllers
- Frontend: TreatmentsView.vue (列表) + TreatmentModal.vue (新增/編輯)
- Data: 利用現有 Treatment, TreatmentSession, RevenueRule, RevenueRecord entities

**Tech Stack:** NestJS, TypeORM, Vue 3, Naive UI, TDD

---

## Phase 1: Backend Services 與測試

### Task 1: 建立 RevenueRuleEngine Service (規則解析)

**Files:**
- Create: `backend/src/revenue/services/revenue-rule-engine.service.ts`
- Create: `backend/src/revenue/services/revenue-rule-engine.service.spec.ts`

**Step 1: 寫失敗測試**

在 `backend/src/revenue/services/revenue-rule-engine.service.spec.ts` 中：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RevenueRuleEngine } from './revenue-rule-engine.service';

describe('RevenueRuleEngine', () => {
  let service: RevenueRuleEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenueRuleEngine],
    }).compile();

    service = module.get<RevenueRuleEngine>(RevenueRuleEngine);
  });

  it('should calculate percentage-based revenue', () => {
    const rule = {
      rule_type: 'percentage',
      rule_payload: { percentage: 50 },
    };
    const totalPrice = 1000;

    const result = service.calculateAmount(totalPrice, rule as any);
    expect(result).toBe(500);
  });

  it('should calculate fixed-amount revenue', () => {
    const rule = {
      rule_type: 'fixed',
      rule_payload: { fixed_amount: 200 },
    };
    const totalPrice = 1000;

    const result = service.calculateAmount(totalPrice, rule as any);
    expect(result).toBe(200);
  });

  it('should throw error for unknown rule type', () => {
    const rule = {
      rule_type: 'unknown',
      rule_payload: {},
    };

    expect(() => service.calculateAmount(1000, rule as any)).toThrow();
  });
});
```

**Step 2: 運行測試確認失敗**

```bash
cd /home/hsu/CRMapp/doctor-crm/backend
npm run test -- src/revenue/services/revenue-rule-engine.service.spec.ts
```

Expected: `FAIL - Cannot find module 'revenue-rule-engine.service'`

**Step 3: 寫最小實現**

在 `backend/src/revenue/services/revenue-rule-engine.service.ts` 中：

```typescript
import { Injectable } from '@nestjs/common';
import { RevenueRule } from '../entities/revenue-rule.entity';

@Injectable()
export class RevenueRuleEngine {
  calculateAmount(totalPrice: number, rule: RevenueRule): number {
    switch (rule.rule_type) {
      case 'percentage': {
        const payload = rule.rule_payload as { percentage: number };
        return (totalPrice * payload.percentage) / 100;
      }
      case 'fixed': {
        const payload = rule.rule_payload as { fixed_amount: number };
        return payload.fixed_amount;
      }
      case 'tiered': {
        const payload = rule.rule_payload as { tiers: any[] };
        const tier = payload.tiers.find(
          (t) => totalPrice >= t.from_amount && (!t.to_amount || totalPrice < t.to_amount)
        );
        if (!tier) throw new Error('No matching tier found');
        return (totalPrice * tier.percentage) / 100;
      }
      default:
        throw new Error(`Unknown rule type: ${rule.rule_type}`);
    }
  }
}
```

**Step 4: 運行測試確認通過**

```bash
npm run test -- src/revenue/services/revenue-rule-engine.service.spec.ts
```

Expected: `PASS - 3 passed`

**Step 5: Commit**

```bash
git add src/revenue/services/revenue-rule-engine.service.ts src/revenue/services/revenue-rule-engine.service.spec.ts
git commit -m "feat: add revenue rule engine for percentage/fixed/tiered calculations"
```

---

### Task 2: 建立 RevenueCalculationService (分潤計算核心)

**Files:**
- Create: `backend/src/revenue/services/revenue-calculation.service.ts`
- Create: `backend/src/revenue/services/revenue-calculation.service.spec.ts`
- Modify: `backend/src/revenue/revenue.module.ts` (加入 Service provider)

**Step 1: 寫失敗測試**

在 `backend/src/revenue/services/revenue-calculation.service.spec.ts`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RevenueCalculationService } from './revenue-calculation.service';
import { RevenueRuleEngine } from './revenue-rule-engine.service';
import { RevenueRecord } from '../entities/revenue-record.entity';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { TreatmentStaffAssignment } from '../../staff/entities/treatment-staff-assignment.entity';
import { RevenueRule } from '../entities/revenue-rule.entity';

describe('RevenueCalculationService', () => {
  let service: RevenueCalculationService;
  let mockRevenueRecordRepo: any;
  let mockSessionRepo: any;

  beforeEach(async () => {
    mockRevenueRecordRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    mockSessionRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueCalculationService,
        RevenueRuleEngine,
        {
          provide: getRepositoryToken(RevenueRecord),
          useValue: mockRevenueRecordRepo,
        },
        {
          provide: getRepositoryToken(TreatmentSession),
          useValue: mockSessionRepo,
        },
      ],
    }).compile();

    service = module.get<RevenueCalculationService>(RevenueCalculationService);
  });

  it('should calculate revenue for a completed session', async () => {
    // Mock data
    const mockSession = {
      id: 'session-123',
      treatment: {
        id: 'treatment-1',
        totalPrice: 3000,
        staffAssignments: [
          {
            staff: { id: 'doctor-1' },
            role: 'doctor',
          },
        ],
      },
    } as any;

    const mockRule = {
      role: 'doctor',
      rule_type: 'percentage',
      rule_payload: { percentage: 50 },
    } as any;

    mockSessionRepo.findOne.mockResolvedValue(mockSession);

    // Mock RevenueRuleEngine
    jest.spyOn(service['ruleEngine'], 'calculateAmount').mockReturnValue(1500);

    // Execute
    const result = await service.calculateForSession('session-123');

    // Assertions
    expect(mockRevenueRecordRepo.create).toHaveBeenCalled();
    expect(mockRevenueRecordRepo.save).toHaveBeenCalled();
  });
});
```

**Step 2: 運行測試確認失敗**

```bash
npm run test -- src/revenue/services/revenue-calculation.service.spec.ts
```

Expected: `FAIL - Cannot find module 'revenue-calculation.service'`

**Step 3: 寫最小實現**

在 `backend/src/revenue/services/revenue-calculation.service.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueRuleEngine } from './revenue-rule-engine.service';
import { RevenueRecord } from '../entities/revenue-record.entity';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';
import { RevenueRule } from '../entities/revenue-rule.entity';

@Injectable()
export class RevenueCalculationService {
  constructor(
    private readonly ruleEngine: RevenueRuleEngine,
    @InjectRepository(RevenueRecord)
    private revenueRecordRepo: Repository<RevenueRecord>,
    @InjectRepository(TreatmentSession)
    private sessionRepo: Repository<TreatmentSession>,
    @InjectRepository(RevenueRule)
    private ruleRepo: Repository<RevenueRule>,
  ) {}

  async calculateForSession(sessionId: string): Promise<void> {
    // 1. 查詢 Session 及其關聯的 Treatment
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['treatment', 'treatment.staffAssignments', 'treatment.staffAssignments.staff'],
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const treatment = session.treatment;
    const totalPrice = treatment.totalPrice;

    // 2. 對每個 StaffAssignment 計算分潤
    for (const assignment of treatment.staffAssignments) {
      const staffId = assignment.staff.id;
      const role = assignment.role; // 或從 assignment.role_id 查詢

      // 3. 查詢該角色的 RevenueRule
      const rule = await this.ruleRepo.findOne({
        where: { role },
        order: { effective_from: 'DESC' },
      });

      if (!rule) {
        console.warn(`No revenue rule found for role ${role}`);
        continue;
      }

      // 4. 計算分潤金額
      const amount = this.ruleEngine.calculateAmount(totalPrice, rule);

      // 5. 創建 RevenueRecord
      const record = this.revenueRecordRepo.create({
        treatment,
        treatment_session: session,
        staff: assignment.staff,
        role,
        amount,
        calculated_at: new Date(),
        locked_at: null,
        status: 'calculated',
      });

      await this.revenueRecordRepo.save(record);
    }
  }
}
```

**Step 4: 運行測試確認通過**

```bash
npm run test -- src/revenue/services/revenue-calculation.service.spec.ts
```

Expected: `PASS`

**Step 5: 更新 Module**

修改 `backend/src/revenue/revenue.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueRecord } from './entities/revenue-record.entity';
import { RevenueRule } from './entities/revenue-rule.entity';
import { RevenueAdjustment } from './entities/revenue-adjustment.entity';
import { RevenueRuleEngine } from './services/revenue-rule-engine.service';
import { RevenueCalculationService } from './services/revenue-calculation.service';

@Module({
  imports: [TypeOrmModule.forFeature([RevenueRecord, RevenueRule, RevenueAdjustment])],
  providers: [RevenueRuleEngine, RevenueCalculationService],
  exports: [RevenueCalculationService],
})
export class RevenueModule {}
```

**Step 6: Commit**

```bash
git add src/revenue/services/revenue-calculation.service.ts src/revenue/services/revenue-calculation.service.spec.ts src/revenue/revenue.module.ts
git commit -m "feat: add revenue calculation service for session completion"
```

---

### Task 3: 建立 TreatmentsService

**Files:**
- Create: `backend/src/treatments/services/treatments.service.ts`
- Modify: `backend/src/treatments/treatments.module.ts`

**Step 1: 寫最小 Service**

在 `backend/src/treatments/services/treatments.service.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from '../entities/treatment.entity';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentRepo: Repository<Treatment>,
  ) {}

  async create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment> {
    const treatment = this.treatmentRepo.create(createTreatmentDto);
    return this.treatmentRepo.save(treatment);
  }

  async findAll(clinicId: string): Promise<Treatment[]> {
    return this.treatmentRepo.find({
      where: { clinicId },
      relations: ['patient', 'staffAssignments', 'staffAssignments.staff'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Treatment> {
    return this.treatmentRepo.findOne({
      where: { id },
      relations: ['patient', 'staffAssignments', 'staffAssignments.staff', 'sessions'],
    });
  }

  async update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<Treatment> {
    await this.treatmentRepo.update(id, updateTreatmentDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.treatmentRepo.delete(id);
  }
}
```

**Step 2: 建立 DTO**

在 `backend/src/treatments/dto/create-treatment.dto.ts`：

```typescript
export class CreateTreatmentDto {
  patientId: string;
  name: string;
  totalPrice: number;
  totalSessions: number;
  startDate?: Date;
  expectedEndDate?: Date;
  notes?: string;
  clinicId: string;
}
```

在 `backend/src/treatments/dto/update-treatment.dto.ts`：

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentDto } from './create-treatment.dto';

export class UpdateTreatmentDto extends PartialType(CreateTreatmentDto) {}
```

**Step 3: Commit**

```bash
git add src/treatments/services/treatments.service.ts src/treatments/dto/
git commit -m "feat: add treatments service with CRUD operations"
```

---

## Phase 2: Backend API Controllers

### Task 4: 建立 TreatmentsController

**Files:**
- Create: `backend/src/treatments/controllers/treatments.controller.ts`
- Modify: `backend/src/treatments/treatments.module.ts`

**Step 1: 寫 Controller**

在 `backend/src/treatments/controllers/treatments.controller.ts`：

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TreatmentsService } from '../services/treatments.service';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Post()
  async create(@Body() createTreatmentDto: CreateTreatmentDto) {
    return this.treatmentsService.create(createTreatmentDto);
  }

  @Get()
  async findAll(@Query('clinicId') clinicId: string) {
    return this.treatmentsService.findAll(clinicId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.treatmentsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTreatmentDto: UpdateTreatmentDto) {
    return this.treatmentsService.update(id, updateTreatmentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.treatmentsService.delete(id);
  }
}
```

**Step 2: 更新 Module**

修改 `backend/src/treatments/treatments.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';
import { TreatmentSession } from './entities/treatment-session.entity';
import { TreatmentsService } from './services/treatments.service';
import { TreatmentsController } from './controllers/treatments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Treatment, TreatmentSession])],
  controllers: [TreatmentsController],
  providers: [TreatmentsService],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
```

**Step 3: Commit**

```bash
git add src/treatments/controllers/treatments.controller.ts src/treatments/treatments.module.ts
git commit -m "feat: add treatments API controller with CRUD endpoints"
```

---

## Phase 3: Frontend UI Components

### Task 5: 建立 TreatmentsView.vue (列表頁面)

**Files:**
- Create: `frontend/src/views/TreatmentsView.vue`
- Modify: `frontend/src/router/index.ts` (加入路由)

**Step 1: 寫 TreatmentsView Component**

在 `frontend/src/views/TreatmentsView.vue`：

```vue
<template>
  <div class="treatments-view">
    <div class="page-header">
      <h1>療程管理</h1>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
          </template>
          新增療程
        </n-button>
        <n-button secondary @click="loadTreatments">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
              </svg>
            </n-icon>
          </template>
          刷新
        </n-button>
      </n-space>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="treatments"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
      />
    </n-card>

    <!-- 新增療程模態框 -->
    <treatment-modal
      v-model:show="showCreateModal"
      :title="'新增療程'"
      @confirm="handleCreate"
    />

    <!-- 編輯療程模態框 -->
    <treatment-modal
      v-model:show="showEditModal"
      :title="`編輯療程`"
      :treatment="editingTreatment"
      @confirm="handleEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { NButton, NTag, NSpace, NIcon, NDataTable, NCard, NModal } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { Treatment } from '@/types';
import { treatmentsApi } from '@/services/api';
import { useUserStore } from '@/stores/user';
import TreatmentModal from '@/components/TreatmentModal.vue';

const userStore = useUserStore();
const loading = ref(false);
const treatments = ref<Treatment[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingTreatment = ref<Treatment | null>(null);

const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const pagination = { pageSize: 10 };

const columns: DataTableColumns<Treatment> = [
  {
    title: '患者',
    key: 'patient.name',
    render: (row) => row.patient?.name || '-',
  },
  {
    title: '療程名稱',
    key: 'name',
  },
  {
    title: '實際售價',
    key: 'totalPrice',
    render: (row) => `¥${row.totalPrice}`,
  },
  {
    title: '進度',
    key: 'completedSessions',
    render: (row) => `${row.completedSessions}/${row.totalSessions}`,
  },
  {
    title: '狀態',
    key: 'status',
    render: (row) => {
      const statusMap = {
        pending: { text: '待開始', type: 'default' as const },
        in_progress: { text: '進行中', type: 'info' as const },
        completed: { text: '已完成', type: 'success' as const },
        cancelled: { text: '已取消', type: 'error' as const },
      };
      const status = statusMap[row.status] || statusMap.pending;
      return h(NTag, { type: status.type }, { default: () => status.text });
    },
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) =>
      h(NSpace, {}, [
        h(NButton, { size: 'small', onClick: () => editTreatment(row) }, { default: () => '編輯' }),
        h(NButton, { size: 'small', type: 'error', onClick: () => deleteTreatment(row.id) }, { default: () => '刪除' }),
      ]),
  },
];

onMounted(() => loadTreatments());

async function loadTreatments() {
  try {
    loading.value = true;
    treatments.value = await treatmentsApi.getAll(clinicId.value);
  } catch (error) {
    console.error('加載療程失敗:', error);
  } finally {
    loading.value = false;
  }
}

function editTreatment(treatment: Treatment) {
  editingTreatment.value = treatment;
  showEditModal.value = true;
}

async function handleCreate(formData: any) {
  try {
    await treatmentsApi.create({ ...formData, clinicId: clinicId.value });
    showCreateModal.value = false;
    await loadTreatments();
  } catch (error) {
    console.error('新增療程失敗:', error);
  }
}

async function handleEdit(formData: any) {
  if (!editingTreatment.value) return;
  try {
    await treatmentsApi.update(editingTreatment.value.id, formData);
    showEditModal.value = false;
    await loadTreatments();
  } catch (error) {
    console.error('編輯療程失敗:', error);
  }
}

async function deleteTreatment(id: string) {
  try {
    await treatmentsApi.delete(id);
    await loadTreatments();
  } catch (error) {
    console.error('刪除療程失敗:', error);
  }
}
</script>

<style scoped>
.treatments-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  color: #333;
}
</style>
```

**Step 2: 更新 Router**

修改 `frontend/src/router/index.ts`，在路由配置中加入：

```typescript
{
  path: '/treatments',
  name: 'Treatments',
  component: () => import('../views/TreatmentsView.vue'),
}
```

**Step 3: Commit**

```bash
git add src/views/TreatmentsView.vue src/router/index.ts
git commit -m "feat: add treatments management view with list and operations"
```

---

### Task 6: 建立 TreatmentModal.vue (新增/編輯模態框)

**Files:**
- Create: `frontend/src/components/TreatmentModal.vue`

**Step 1: 寫 Modal Component**

在 `frontend/src/components/TreatmentModal.vue`：

```vue
<template>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    :title="title"
    positive-text="確認"
    negative-text="取消"
    @positive-click="handleSubmit"
    @negative-click="showModal = false"
  >
    <n-form ref="formRef" :model="formValue" :rules="rules">
      <n-form-item label="患者 *" path="patientId">
        <n-select
          v-model:value="formValue.patientId"
          :options="patientOptions"
          placeholder="選擇患者"
        />
      </n-form-item>

      <n-form-item label="療程名稱 *" path="name">
        <n-input v-model:value="formValue.name" placeholder="請輸入療程名稱" />
      </n-form-item>

      <n-form-item label="建議售價" path="suggestedPrice">
        <n-input-number
          v-model:value="formValue.suggestedPrice"
          :disabled="true"
          prefix="¥"
        />
      </n-form-item>

      <n-form-item label="實際售價 *" path="totalPrice">
        <n-input-number
          v-model:value="formValue.totalPrice"
          prefix="¥"
          placeholder="請輸入實際售價"
        />
      </n-form-item>

      <n-form-item label="總次數 *" path="totalSessions">
        <n-input-number
          v-model:value="formValue.totalSessions"
          placeholder="請輸入療程總次數"
        />
      </n-form-item>

      <n-form-item label="預期完成日期 *" path="expectedEndDate">
        <n-date-picker
          v-model:value="formValue.expectedEndDate"
          type="date"
          placeholder="選擇預期完成日期"
        />
      </n-form-item>

      <n-form-item label="預約提醒" path="enableReminder">
        <n-checkbox v-model:checked="formValue.enableReminder">
          啟用預約提醒
        </n-checkbox>
      </n-form-item>

      <n-form-item label="備註" path="notes">
        <n-input
          v-model:value="formValue.notes"
          type="textarea"
          placeholder="請輸入療程備註"
          :rows="3"
        />
      </n-form-item>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDatePicker,
  NSelect,
  NCheckbox,
  useMessage,
} from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import type { Treatment } from '@/types';
import { patientsApi } from '@/services/api';

interface Props {
  show: boolean;
  title: string;
  treatment?: Treatment | null;
}

const props = withDefaults(defineProps<Props>(), {
  treatment: null,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [data: any];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const patientOptions = ref<any[]>([]);

const formValue = ref({
  patientId: '',
  name: '',
  suggestedPrice: 0,
  totalPrice: 0,
  totalSessions: 1,
  expectedEndDate: null as any,
  enableReminder: false,
  notes: '',
});

const rules: FormRules = {
  patientId: [{ required: true, message: '請選擇患者' }],
  name: [{ required: true, message: '請輸入療程名稱' }],
  totalPrice: [{ required: true, message: '請輸入實際售價' }],
  totalSessions: [{ required: true, message: '請輸入療程次數' }],
  expectedEndDate: [{ required: true, message: '請選擇預期完成日期' }],
};

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
});

watch(() => props.treatment, (treatment) => {
  if (treatment) {
    formValue.value = {
      patientId: treatment.patientId,
      name: treatment.name,
      suggestedPrice: treatment.totalPrice,
      totalPrice: treatment.totalPrice,
      totalSessions: treatment.totalSessions,
      expectedEndDate: treatment.expectedEndDate ? new Date(treatment.expectedEndDate).getTime() : null,
      enableReminder: false,
      notes: treatment.notes || '',
    };
  } else {
    resetForm();
  }
});

async function loadPatients() {
  try {
    const patients = await patientsApi.getAll('clinic_001');
    patientOptions.value = patients.map((p: any) => ({
      label: p.name,
      value: p.id,
    }));
  } catch (error) {
    message.error('加載患者列表失敗');
  }
}

function resetForm() {
  formValue.value = {
    patientId: '',
    name: '',
    suggestedPrice: 0,
    totalPrice: 0,
    totalSessions: 1,
    expectedEndDate: null,
    enableReminder: false,
    notes: '',
  };
}

async function handleSubmit() {
  try {
    if (!formRef.value) return;
    await formRef.value.validate();

    emit('confirm', {
      patientId: formValue.value.patientId,
      name: formValue.value.name,
      totalPrice: formValue.value.totalPrice,
      totalSessions: formValue.value.totalSessions,
      expectedEndDate: formValue.value.expectedEndDate ? new Date(formValue.value.expectedEndDate) : null,
      notes: formValue.value.notes,
    });
  } catch (error) {
    message.error('表單驗證失敗');
  }
}

loadPatients();
</script>
```

**Step 2: Commit**

```bash
git add src/components/TreatmentModal.vue
git commit -m "feat: add treatment modal for create and edit operations"
```

---

## Phase 4: API Integration & Testing

### Task 7: 更新 API Service

**Files:**
- Modify: `frontend/src/services/api.ts`

**Step 1: 添加 TreatmentsAPI**

修改 `frontend/src/services/api.ts`，在 export section 中加入：

```typescript
export const treatmentsApi = {
  getAll: (clinicId: string, params?: any) =>
    http.get('/treatments', { params: { clinicId, ...params } }),

  getById: (id: string) =>
    http.get(`/treatments/${id}`),

  create: (data: any) => http.post('/treatments', data),

  update: (id: string, data: any) => http.put(`/treatments/${id}`, data),

  delete: (id: string) => http.delete(`/treatments/${id}`),
};
```

**Step 2: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: add treatments API endpoints to service"
```

---

## Phase 5: Build & Verify

### Task 8: 構建後端並驗證

**Files:**
- Modify: `backend/src/app.module.ts` (確保 TreatmentsModule 已被導入)

**Step 1: 構建**

```bash
cd /home/hsu/CRMapp/doctor-crm/backend
npm run build
```

Expected: `✓ Built successfully`

**Step 2: 運行測試**

```bash
npm run test
```

Expected: `X passed, X failed (或全部通過)`

**Step 3: Commit**

```bash
git add .
git commit -m "build: backend build and tests passing"
```

---

### Task 9: 構建前端並驗證

**Files:**
- None (確認所有檔案已更新)

**Step 1: 構建**

```bash
cd /home/hsu/CRMapp/doctor-crm/frontend
npm run build
```

Expected: `✓ built in X.XXs`

**Step 2: Commit**

```bash
git add .
git commit -m "build: frontend build complete"
```

---

## 總結

✅ **已完成**:
- RevenueRuleEngine Service (支持百分比、固定、階梯式)
- RevenueCalculationService (自動計算分潤)
- TreatmentsService (CRUD 邏輯)
- TreatmentsController (API endpoints)
- TreatmentsView.vue (列表頁面)
- TreatmentModal.vue (新增/編輯模態框)
- API 集成
- 構建驗證

---

## 實施選項

**計畫已保存到 `docs/plans/2026-02-10-treatments-implementation.md`**

兩個執行選項：

**1️⃣ Subagent-Driven（本會話）**
- 我為每個任務分派新 subagent
- 任務之間進行代碼審查
- 快速迭代

**2️⃣ Parallel Session（新會話）**
- 在新會話中使用 executing-plans
- 批量執行 with checkpoints
- 適合在另一個時間執行

**您選擇哪一個？** 🚀
