# 前端功能擴展實現計劃 (患者搜尋、療程模板、次數管理、PPF配置)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 在現有 Vue 3 前端基礎上，添加患者全欄位搜尋、療程療法模板管理、療程次數詳細管理、PPF 分潤規則後台配置等 4 項核心功能。

**Architecture:**
- 前端：Vue 3 + Composition API + TypeScript + Naive UI
- 後端 API：擴展 NestJS 後端服務
- 數據持久化：SQLite（開發環境）
- 國際化：繁體中文優先

**Tech Stack:**
- Vue 3, TypeScript 5.7, Naive UI, Axios, vue-i18n
- NestJS 11, TypeORM, SQLite
- TDD (測試先行)

---

## 功能優先級與實現順序

| 優先級 | 功能 | 預計工時 | 備註 |
|--------|------|--------|------|
| 1 | 患者管理搜尋框 | 2-3小時 | 前端+可選後端搜尋優化 |
| 2 | 療程療法模板管理 | 3-4小時 | 新增後端模塊 + 前端頁面 |
| 3 | 療程次數管理 | 4-5小時 | 擴展 Treatment modal + 詳細管理介面 |
| 4 | PPF 分潤規則配置 | 3-4小時 | 新增後台設定頁面 |

---

## Task 1: 患者管理搜尋框實現

### 1.1 後端搜尋 API (可選 - 此版本前端實現)

**Files:**
- Modify: `backend/src/patients/services/patients.service.ts`
- Modify: `backend/src/patients/controllers/patients.controller.ts`

**Step 1: 在 PatientsService 中添加搜尋方法**

在 `patients.service.ts` 中的 `findAll()` 方法後添加新方法：

```typescript
async searchPatients(
  clinicId: string,
  query: string,
): Promise<Patient[]> {
  // 搜尋條件：姓名、電話、身分證、生日都可以搜尋
  return this.patientRepository.find({
    where: [
      { clinicId, name: ILike(`%${query}%`) },
      { clinicId, phone: ILike(`%${query}%`) },
      { clinicId, idNumber: ILike(`%${query}%`) },
      { clinicId, dateOfBirth: ILike(`%${query}%`) },
    ],
    order: { createdAt: 'DESC' },
    take: 50,
  });
}
```

**Step 2: 在 PatientsController 中添加搜尋端點**

```typescript
@Post('search')
async search(
  @Body() dto: { query: string; clinicId: string },
): Promise<Patient[]> {
  return this.patientsService.searchPatients(dto.clinicId, dto.query);
}
```

**Step 3: 提交**

```bash
git add backend/src/patients/services/patients.service.ts
git add backend/src/patients/controllers/patients.controller.ts
git commit -m "feat: add patient search API endpoint"
```

---

### 1.2 前端搜尋框實現

**Files:**
- Modify: `frontend/src/views/PatientsView.vue`
- Create: `frontend/src/components/PatientSearchBox.vue` (可選，或直接在主頁實現)

**Step 1: 在 PatientsView 中添加搜尋狀態**

在 `<script setup>` 中的 `ref` 聲明後添加：

```typescript
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref<Patient[]>([]);

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    // 如果搜尋框為空，顯示所有患者
    await loadPatients();
    return;
  }

  isSearching.value = true;
  try {
    // 前端模糊搜尋實現（無需呼叫後端）
    searchResults.value = patients.value.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      patient.phone.includes(searchQuery.value) ||
      patient.idNumber?.includes(searchQuery.value) ||
      formatDate(patient.dateOfBirth)?.includes(searchQuery.value)
    );
  } catch (error) {
    message.error('搜尋失敗');
  } finally {
    isSearching.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  loadPatients();
};
```

**Step 2: 在 template 中添加搜尋框 UI**

在 `<div class="page-header">` 中 `<h1>患者管理</h1>` 後添加：

```vue
<div class="search-bar">
  <n-space>
    <n-input
      v-model:value="searchQuery"
      placeholder="輸入患者資訊搜尋：身分證號、姓名、電話或生日（如0920代表9月20日）"
      clearable
      @keyup.enter="performSearch"
    />
    <n-button type="primary" @click="performSearch" :loading="isSearching">
      搜尋
    </n-button>
    <n-button secondary @click="clearSearch">
      清除
    </n-button>
  </n-space>
</div>
```

**Step 3: 修改表格數據綁定，顯示搜尋結果或全部患者**

在 `<n-data-table>` 中修改 `:data` 綁定：

```vue
:data="searchResults.length > 0 ? searchResults : patients"
```

**Step 4: 添加 CSS 樣式**

在 `<style>` 部分添加：

```css
.search-bar {
  margin: 16px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
```

**Step 5: 測試搜尋功能**

- 在開發環境中測試搜尋功能
- 驗證可以搜尋到患者（姓名、電話、身分證、生日）
- 驗證清除按鈕恢復顯示所有患者

**Step 6: 提交**

```bash
git add frontend/src/views/PatientsView.vue
git commit -m "feat: add patient search functionality with multi-field support"
```

---

## Task 2: 療程療法模板管理

### 2.1 後端療法模板模組

**Files:**
- Create: `backend/src/treatment-templates/entities/treatment-template.entity.ts`
- Create: `backend/src/treatment-templates/dto/create-treatment-template.dto.ts`
- Create: `backend/src/treatment-templates/dto/update-treatment-template.dto.ts`
- Create: `backend/src/treatment-templates/services/treatment-template.service.ts`
- Create: `backend/src/treatment-templates/controllers/treatment-template.controller.ts`
- Create: `backend/src/treatment-templates/treatment-templates.module.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: 建立 TreatmentTemplate Entity**

Create `backend/src/treatment-templates/entities/treatment-template.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('treatment_templates')
export class TreatmentTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // 療法名稱 e.g. "玻尿酸注射"

  @Column({ type: 'text', nullable: true })
  description: string; // 療法描述

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  defaultPrice: number; // 預設價格

  @Column({ type: 'int', default: 1 })
  defaultSessions: number; // 預設次數

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: 建立 DTOs**

Create `backend/src/treatment-templates/dto/create-treatment-template.dto.ts`:

```typescript
import { IsString, IsNumber, IsOptional, IsInt, Min, MinLength } from 'class-validator';

export class CreateTreatmentTemplateDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  defaultPrice: number;

  @IsInt()
  @Min(1)
  defaultSessions: number;

  @IsString()
  clinicId: string;
}
```

Create `backend/src/treatment-templates/dto/update-treatment-template.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentTemplateDto } from './create-treatment-template.dto';

export class UpdateTreatmentTemplateDto extends PartialType(CreateTreatmentTemplateDto) {}
```

**Step 3: 建立 Service**

Create `backend/src/treatment-templates/services/treatment-template.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentTemplate } from '../entities/treatment-template.entity';
import { CreateTreatmentTemplateDto } from '../dto/create-treatment-template.dto';
import { UpdateTreatmentTemplateDto } from '../dto/update-treatment-template.dto';

@Injectable()
export class TreatmentTemplateService {
  constructor(
    @InjectRepository(TreatmentTemplate)
    private readonly templateRepository: Repository<TreatmentTemplate>,
  ) {}

  async create(dto: CreateTreatmentTemplateDto): Promise<TreatmentTemplate> {
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  async findAll(clinicId: string): Promise<TreatmentTemplate[]> {
    return this.templateRepository.find({
      where: { clinicId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, clinicId: string): Promise<TreatmentTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, clinicId },
    });
    if (!template) {
      throw new NotFoundException(`療法模板 ${id} 不存在`);
    }
    return template;
  }

  async update(
    id: string,
    clinicId: string,
    dto: UpdateTreatmentTemplateDto,
  ): Promise<TreatmentTemplate> {
    const template = await this.findById(id, clinicId);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async delete(id: string, clinicId: string): Promise<void> {
    const template = await this.findById(id, clinicId);
    template.isActive = false;
    await this.templateRepository.save(template);
  }
}
```

**Step 4: 建立 Controller**

Create `backend/src/treatment-templates/controllers/treatment-template.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TreatmentTemplateService } from '../services/treatment-template.service';
import { CreateTreatmentTemplateDto } from '../dto/create-treatment-template.dto';
import { UpdateTreatmentTemplateDto } from '../dto/update-treatment-template.dto';

@Controller('treatment-templates')
@UseGuards(JwtAuthGuard)
export class TreatmentTemplateController {
  constructor(private readonly templateService: TreatmentTemplateService) {}

  @Post()
  async create(@Body() dto: CreateTreatmentTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get()
  async findAll(@Body('clinicId') clinicId: string) {
    return this.templateService.findAll(clinicId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Body('clinicId') clinicId: string) {
    return this.templateService.findById(id, clinicId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentTemplateDto,
  ) {
    return this.templateService.update(id, dto.clinicId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Body('clinicId') clinicId: string) {
    return this.templateService.delete(id, clinicId);
  }
}
```

**Step 5: 建立 Module**

Create `backend/src/treatment-templates/treatment-templates.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentTemplate } from './entities/treatment-template.entity';
import { TreatmentTemplateService } from './services/treatment-template.service';
import { TreatmentTemplateController } from './controllers/treatment-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentTemplate])],
  controllers: [TreatmentTemplateController],
  providers: [TreatmentTemplateService],
  exports: [TreatmentTemplateService],
})
export class TreatmentTemplatesModule {}
```

**Step 6: 在 AppModule 中註冊模塊**

Modify `backend/src/app.module.ts`:

在 `imports` 陣列中添加：

```typescript
import { TreatmentTemplatesModule } from './treatment-templates/treatment-templates.module';

@Module({
  imports: [
    // ... 其他模塊
    TreatmentTemplatesModule,
  ],
  // ...
})
```

**Step 7: 在 database.config.ts 中註冊 Entity**

Modify `backend/src/config/database.config.ts`:

在 `entities` 陣列中添加 `TreatmentTemplate`

**Step 8: 提交**

```bash
git add backend/src/treatment-templates/
git add backend/src/app.module.ts
git add backend/src/config/database.config.ts
git commit -m "feat: add treatment template backend API"
```

---

### 2.2 前端療法模板管理頁面

**Files:**
- Create: `frontend/src/views/TreatmentTemplatesView.vue`
- Create: `frontend/src/services/api/treatment-templates-api.ts`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/router/index.ts` (添加路由)

**Step 1: 建立 API 服務**

Create `frontend/src/services/api/treatment-templates-api.ts`:

```typescript
import { request } from '../axios-instance';

export interface TreatmentTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  defaultSessions: number;
  clinicId: string;
  isActive: boolean;
  createdAt: Date;
}

export const treatmentTemplatesApi = {
  create: (data: Omit<TreatmentTemplate, 'id' | 'createdAt'>) =>
    request.post<TreatmentTemplate>('/treatment-templates', data),

  getAll: (clinicId: string) =>
    request.get<TreatmentTemplate[]>('/treatment-templates', {
      params: { clinicId },
    }),

  getById: (id: string, clinicId: string) =>
    request.get<TreatmentTemplate>(`/treatment-templates/${id}`, {
      params: { clinicId },
    }),

  update: (id: string, data: Partial<TreatmentTemplate>) =>
    request.put<TreatmentTemplate>(`/treatment-templates/${id}`, data),

  delete: (id: string, clinicId: string) =>
    request.delete<void>(`/treatment-templates/${id}`, {
      params: { clinicId },
    }),
};
```

**Step 2: 在 api.ts 中導出**

Modify `frontend/src/services/api.ts`:

```typescript
export { treatmentTemplatesApi } from './api/treatment-templates-api';
```

**Step 3: 建立前端頁面**

Create `frontend/src/views/TreatmentTemplatesView.vue`:

```vue
<template>
  <n-message-provider>
    <n-dialog-provider>
      <div class="templates-view">
        <div class="page-header">
          <h1>療法模板管理</h1>
          <n-button type="primary" @click="showCreateModal = true">
            新增療法
          </n-button>
        </div>

        <n-card>
          <n-data-table
            :columns="columns"
            :data="templates"
            :loading="loading"
            :pagination="pagination"
            :row-key="(row) => row.id"
          />
        </n-card>

        <!-- 新增/編輯模態框 -->
        <n-modal
          v-model:show="showModal"
          :title="isEditing ? '編輯療法' : '新增療法'"
          preset="dialog"
          :positive-text="'確認'"
          :negative-text="'取消'"
          @positive-click="handleSubmit"
          @negative-click="showModal = false"
        >
          <n-form
            ref="formRef"
            :model="formValue"
            :rules="rules"
            label-placement="left"
            :label-width="100"
          >
            <n-form-item label="療法名稱" path="name">
              <n-input v-model:value="formValue.name" placeholder="e.g. 玻尿酸注射" />
            </n-form-item>

            <n-form-item label="描述" path="description">
              <n-input
                v-model:value="formValue.description"
                type="textarea"
                placeholder="療法描述"
              />
            </n-form-item>

            <n-form-item label="預設價格" path="defaultPrice">
              <n-input-number
                v-model:value="formValue.defaultPrice"
                :min="0"
                placeholder="預設價格"
              />
            </n-form-item>

            <n-form-item label="預設次數" path="defaultSessions">
              <n-input-number
                v-model:value="formValue.defaultSessions"
                :min="1"
                placeholder="預設次數"
              />
            </n-form-item>
          </n-form>
        </n-modal>
      </div>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import {
  NButton,
  NDataTable,
  NCard,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NMessageProvider,
  NDialogProvider,
  useMessage,
  useDialog,
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { treatmentTemplatesApi } from '@/services/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const message = useMessage();
const dialog = useDialog();
const formRef = ref<FormInst | null>(null);

const loading = ref(false);
const templates = ref<any[]>([]);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const formValue = ref({
  name: '',
  description: '',
  defaultPrice: 0,
  defaultSessions: 1,
});

const rules: FormRules = {
  name: [{ required: true, message: '療法名稱必填', trigger: 'blur' }],
  defaultPrice: [{ required: true, message: '預設價格必填', trigger: 'change' }],
  defaultSessions: [{ required: true, message: '預設次數必填', trigger: 'change' }],
};

const pagination = { pageSize: 10 };

const columns: DataTableColumns = [
  { title: '療法名稱', key: 'name' },
  { title: '預設價格', key: 'defaultPrice', width: 100 },
  { title: '預設次數', key: 'defaultSessions', width: 100 },
  {
    title: '操作',
    width: 200,
    render: (row) =>
      h('div', [
        h(NButton, {
          type: 'primary',
          text: true,
          onClick: () => handleEdit(row),
        }, { default: () => '編輯' }),
        h(NButton, {
          type: 'error',
          text: true,
          onClick: () => handleDelete(row),
        }, { default: () => '刪除' }),
      ]),
  },
];

const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await treatmentTemplatesApi.getAll(clinicId.value);
    templates.value = response.data;
  } catch (error) {
    message.error('載入療法模板失敗');
  } finally {
    loading.value = false;
  }
};

const handleEdit = (row: any) => {
  isEditing.value = true;
  editingId.value = row.id;
  formValue.value = { ...row };
  showModal.value = true;
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  try {
    if (isEditing.value && editingId.value) {
      await treatmentTemplatesApi.update(editingId.value, {
        ...formValue.value,
        clinicId: clinicId.value,
      });
      message.success('更新成功');
    } else {
      await treatmentTemplatesApi.create({
        ...formValue.value,
        clinicId: clinicId.value,
      });
      message.success('新增成功');
    }
    showModal.value = false;
    await loadTemplates();
  } catch (error) {
    message.error('操作失敗');
  }
};

const handleDelete = (row: any) => {
  dialog.warning({
    title: '確認刪除',
    content: `確定要刪除療法「${row.name}」嗎？`,
    positiveText: '確定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await treatmentTemplatesApi.delete(row.id, clinicId.value);
        message.success('刪除成功');
        await loadTemplates();
      } catch (error) {
        message.error('刪除失敗');
      }
    },
  });
};

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.templates-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
```

**Step 4: 添加路由**

Modify `frontend/src/router/index.ts`:

```typescript
import TreatmentTemplatesView from '@/views/TreatmentTemplatesView.vue';

const routes = [
  // ... 其他路由
  {
    path: '/treatment-templates',
    name: 'TreatmentTemplates',
    component: TreatmentTemplatesView,
  },
];
```

**Step 5: 測試**

```bash
npm run dev
# 訪問 http://localhost:5173/treatment-templates
```

**Step 6: 提交**

```bash
git add frontend/src/views/TreatmentTemplatesView.vue
git add frontend/src/services/api/treatment-templates-api.ts
git add frontend/src/services/api.ts
git add frontend/src/router/index.ts
git commit -m "feat: add treatment template management frontend"
```

---

## Task 3: 療程次數詳細管理

### 3.1 擴展 TreatmentSession 數據模型

**Files:**
- Modify: `backend/src/treatments/entities/treatment-session.entity.ts`
- Modify: `backend/src/treatments/dto/create-treatment-session.dto.ts`

**Step 1: 擴展 TreatmentSession Entity**

Modify `backend/src/treatments/entities/treatment-session.entity.ts`:

在現有的 TreatmentSession entity 中添加新欄位：

```typescript
@Column({ type: 'timestamp', nullable: true })
scheduledTime: Date; // 預定時間

@Column({ type: 'timestamp', nullable: true })
actualStartTime: Date; // 實際開始時間

@Column({ type: 'timestamp', nullable: true })
actualEndTime: Date; // 實際結束時間

@Column({ type: 'int', default: 0 })
durationMinutes: number; // 療程時長（分鐘）

@Column({ type: 'varchar', length: 32, nullable: true })
executedBy: string; // 執行人員 ID

@Column({ type: 'text', nullable: true })
notes: string; // 療程記錄備註
```

**Step 2: 擴展 CreateTreatmentSessionDto**

Modify `backend/src/treatments/dto/create-treatment-session.dto.ts`:

```typescript
@IsOptional()
@IsDateString()
scheduledTime?: string;

@IsOptional()
@IsString()
executedBy?: string;

@IsOptional()
@IsString()
notes?: string;
```

**Step 3: 提交**

```bash
git add backend/src/treatments/entities/treatment-session.entity.ts
git add backend/src/treatments/dto/create-treatment-session.dto.ts
git commit -m "feat: extend treatment session with time tracking and notes"
```

---

### 3.2 前端療程次數詳細管理界面

**Files:**
- Create: `frontend/src/components/TreatmentSessionsManager.vue`
- Modify: `frontend/src/views/TreatmentsView.vue`
- Modify: `frontend/src/components/TreatmentModal.vue`

**Step 1: 建立療程次數管理組件**

Create `frontend/src/components/TreatmentSessionsManager.vue`:

```vue
<template>
  <n-card title="療程次數管理（1-10次）" :segmented="{ content: true }">
    <n-space vertical size="large">
      <n-table :columns="columns" :data="sessions" :bordered="false" :single-line="false" />

      <div class="session-form">
        <h4>記錄療程次數</h4>
        <n-form :model="newSession" label-placement="left" :label-width="100">
          <n-form-item label="次數">
            <n-select
              v-model:value="newSession.sessionNumber"
              :options="availableSessionNumbers"
              placeholder="選擇次數"
            />
          </n-form-item>

          <n-form-item label="預定時間">
            <n-date-picker
              v-model:value="newSession.scheduledTime"
              type="datetime"
              placeholder="選擇預定時間"
            />
          </n-form-item>

          <n-form-item label="執行人員">
            <n-select
              v-model:value="newSession.executedBy"
              :options="staffOptions"
              placeholder="選擇執行人員"
            />
          </n-form-item>

          <n-form-item label="完成狀態">
            <n-radio-group v-model:value="newSession.status">
              <n-radio value="scheduled">未完成</n-radio>
              <n-radio value="completed">已完成</n-radio>
            </n-radio-group>
          </n-form-item>

          <n-form-item v-if="newSession.status === 'completed'" label="實際完成時間">
            <n-date-picker
              v-model:value="newSession.actualEndTime"
              type="datetime"
              placeholder="選擇完成時間"
            />
          </n-form-item>

          <n-form-item label="備註">
            <n-input
              v-model:value="newSession.notes"
              type="textarea"
              placeholder="療程記錄備註"
            />
          </n-form-item>

          <n-space>
            <n-button type="primary" @click="addSession">新增次數記錄</n-button>
            <n-button @click="resetForm">清除</n-button>
          </n-space>
        </n-form>
      </div>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NCard, NSpace, NTable, NForm, NFormItem, NSelect, NDatePicker, NRadioGroup, NRadio, NButton, NInput, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

const message = useMessage();

interface SessionRecord {
  sessionNumber: number;
  scheduledTime: number | null;
  actualStartTime: number | null;
  actualEndTime: number | null;
  executedBy: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

interface Props {
  totalSessions: number;
  clinicId: string;
}

const props = defineProps<Props>();

const sessions = ref<SessionRecord[]>([]);

const newSession = ref<SessionRecord>({
  sessionNumber: null,
  scheduledTime: null,
  actualStartTime: null,
  actualEndTime: null,
  executedBy: null,
  status: 'scheduled',
  notes: '',
});

const staffOptions = ref([
  { label: '醫生 A', value: 'staff-1' },
  { label: '護理師 B', value: 'staff-2' },
  { label: '美容師 C', value: 'staff-3' },
]); // 實際應從 API 獲取

const availableSessionNumbers = computed(() => {
  const used = new Set(sessions.value.map(s => s.sessionNumber));
  const available = [];
  for (let i = 1; i <= props.totalSessions; i++) {
    if (!used.has(i)) {
      available.push({ label: `第 ${i} 次`, value: i });
    }
  }
  return available;
});

const columns: DataTableColumns = [
  {
    title: '次數',
    key: 'sessionNumber',
    width: 80,
  },
  {
    title: '預定時間',
    key: 'scheduledTime',
    width: 150,
    render: (row) => formatDate(row.scheduledTime),
  },
  {
    title: '完成時間',
    key: 'actualEndTime',
    width: 150,
    render: (row) => formatDate(row.actualEndTime) || '-',
  },
  {
    title: '執行人員',
    key: 'executedBy',
    width: 120,
  },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    render: (row) => getStatusLabel(row.status),
  },
  {
    title: '備註',
    key: 'notes',
    width: 200,
  },
];

const addSession = () => {
  if (!newSession.value.sessionNumber) {
    message.warning('請選擇次數');
    return;
  }

  sessions.value.push({ ...newSession.value });
  message.success('次數記錄已添加');
  resetForm();
};

const resetForm = () => {
  newSession.value = {
    sessionNumber: null,
    scheduledTime: null,
    actualStartTime: null,
    actualEndTime: null,
    executedBy: null,
    status: 'scheduled',
    notes: '',
  };
};

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-TW');
};

const getStatusLabel = (status: string) => {
  const map = {
    scheduled: '未完成',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
};
</script>

<style scoped>
.session-form {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

h4 {
  margin: 0 0 16px 0;
}
</style>
```

**Step 2: 在 TreatmentModal 中集成次數管理**

Modify `frontend/src/components/TreatmentModal.vue`:

在模態框中添加一個標籤頁或部分，展示療程次數管理組件。

**Step 3: 測試**

在治療頁面測試次數管理功能。

**Step 4: 提交**

```bash
git add frontend/src/components/TreatmentSessionsManager.vue
git add frontend/src/components/TreatmentModal.vue
git commit -m "feat: add detailed treatment session management"
```

---

## Task 4: PPF 分潤規則後台配置

### 4.1 擴展後端分潤配置 API

**Files:**
- Modify: `backend/src/revenue/entities/revenue-rule.entity.ts`
- Create: `backend/src/revenue/entities/ppf-config.entity.ts`
- Create: `backend/src/revenue/services/ppf-config.service.ts`
- Create: `backend/src/revenue/controllers/ppf-config.controller.ts`

**Step 1: 建立 PPFConfig Entity**

Create `backend/src/revenue/entities/ppf-config.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ppf_configs')
export class PPFConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  treatmentTemplateName: string; // 療法名稱

  @Column({ type: 'varchar', length: 50 })
  roleType: string; // 職位類型: doctor, therapist, beautician, assistant, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number; // 分潤比例 0-100

  @Column({ type: 'int', default: 1 })
  priority: number; // 優先級（多個規則時的適用順序）

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: 建立 PPFConfigService**

Create `backend/src/revenue/services/ppf-config.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PPFConfig } from '../entities/ppf-config.entity';

export interface CreatePPFConfigDto {
  treatmentTemplateName: string;
  roleType: string;
  percentage: number;
  priority?: number;
  clinicId: string;
}

@Injectable()
export class PPFConfigService {
  constructor(
    @InjectRepository(PPFConfig)
    private readonly configRepository: Repository<PPFConfig>,
  ) {}

  async create(dto: CreatePPFConfigDto): Promise<PPFConfig> {
    const config = this.configRepository.create(dto);
    return this.configRepository.save(config);
  }

  async findAll(clinicId: string): Promise<PPFConfig[]> {
    return this.configRepository.find({
      where: { clinicId, isActive: true },
      order: { treatmentTemplateName: 'ASC', priority: 'ASC' },
    });
  }

  async findByTreatmentAndRole(
    treatmentTemplateName: string,
    roleType: string,
    clinicId: string,
  ): Promise<PPFConfig | null> {
    return this.configRepository.findOne({
      where: { treatmentTemplateName, roleType, clinicId, isActive: true },
    });
  }

  async update(
    id: string,
    clinicId: string,
    dto: Partial<CreatePPFConfigDto>,
  ): Promise<PPFConfig> {
    const config = await this.configRepository.findOne({
      where: { id, clinicId },
    });
    if (!config) {
      throw new NotFoundException(`PPF 配置 ${id} 不存在`);
    }
    Object.assign(config, dto);
    return this.configRepository.save(config);
  }

  async delete(id: string, clinicId: string): Promise<void> {
    const config = await this.configRepository.findOne({
      where: { id, clinicId },
    });
    if (!config) {
      throw new NotFoundException(`PPF 配置 ${id} 不存在`);
    }
    config.isActive = false;
    await this.configRepository.save(config);
  }
}
```

**Step 3: 建立 PPFConfigController**

Create `backend/src/revenue/controllers/ppf-config.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PPFConfigService } from '../services/ppf-config.service';

@Controller('ppf-configs')
@UseGuards(JwtAuthGuard)
export class PPFConfigController {
  constructor(private readonly ppfConfigService: PPFConfigService) {}

  @Post()
  async create(@Body() dto: any) {
    return this.ppfConfigService.create(dto);
  }

  @Get()
  async findAll(@Body('clinicId') clinicId: string) {
    return this.ppfConfigService.findAll(clinicId);
  }

  @Get(':treatment/:role')
  async findByTreatmentAndRole(
    @Param('treatment') treatment: string,
    @Param('role') role: string,
    @Body('clinicId') clinicId: string,
  ) {
    return this.ppfConfigService.findByTreatmentAndRole(treatment, role, clinicId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.ppfConfigService.update(id, dto.clinicId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Body('clinicId') clinicId: string) {
    return this.ppfConfigService.delete(id, clinicId);
  }
}
```

**Step 4: 在 RevenueModule 中註冊**

Modify `backend/src/revenue/revenue.module.ts`:

```typescript
import { PPFConfig } from './entities/ppf-config.entity';
import { PPFConfigService } from './services/ppf-config.service';
import { PPFConfigController } from './controllers/ppf-config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueRule,
      RevenueRecord,
      RevenueAdjustment,
      PPFConfig, // 添加
    ]),
  ],
  controllers: [
    RevenueRuleController,
    RevenueRecordController,
    RevenueAdjustmentController,
    PPFConfigController, // 添加
  ],
  providers: [
    RevenueService,
    RevenueRuleService,
    RevenueRecordService,
    RevenueAdjustmentService,
    PPFConfigService, // 添加
  ],
  exports: [PPFConfigService],
})
export class RevenueModule {}
```

**Step 5: 提交**

```bash
git add backend/src/revenue/entities/ppf-config.entity.ts
git add backend/src/revenue/services/ppf-config.service.ts
git add backend/src/revenue/controllers/ppf-config.controller.ts
git add backend/src/revenue/revenue.module.ts
git commit -m "feat: add PPF configuration backend API"
```

---

### 4.2 前端 PPF 分潤配置頁面

**Files:**
- Create: `frontend/src/views/PPFConfigView.vue`
- Create: `frontend/src/services/api/ppf-config-api.ts`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/router/index.ts`

**Step 1: 建立 API 服務**

Create `frontend/src/services/api/ppf-config-api.ts`:

```typescript
import { request } from '../axios-instance';

export interface PPFConfig {
  id: string;
  treatmentTemplateName: string;
  roleType: string;
  percentage: number;
  priority: number;
  clinicId: string;
  isActive: boolean;
}

export const ppfConfigApi = {
  create: (data: Omit<PPFConfig, 'id'>) =>
    request.post<PPFConfig>('/ppf-configs', data),

  getAll: (clinicId: string) =>
    request.get<PPFConfig[]>('/ppf-configs', {
      params: { clinicId },
    }),

  update: (id: string, data: Partial<PPFConfig>) =>
    request.put<PPFConfig>(`/ppf-configs/${id}`, data),

  delete: (id: string, clinicId: string) =>
    request.delete<void>(`/ppf-configs/${id}`, {
      params: { clinicId },
    }),
};
```

**Step 2: 在 api.ts 中導出**

Modify `frontend/src/services/api.ts`:

```typescript
export { ppfConfigApi } from './api/ppf-config-api';
```

**Step 3: 建立前端頁面**

Create `frontend/src/views/PPFConfigView.vue`:

```vue
<template>
  <n-message-provider>
    <n-dialog-provider>
      <div class="ppf-config-view">
        <div class="page-header">
          <h1>PPF 分潤規則配置</h1>
          <n-button type="primary" @click="showModal = true">
            新增配置
          </n-button>
        </div>

        <n-card>
          <n-data-table
            :columns="columns"
            :data="configs"
            :loading="loading"
            :pagination="pagination"
            :row-key="(row) => row.id"
          />
        </n-card>

        <!-- 新增/編輯模態框 -->
        <n-modal
          v-model:show="showModal"
          :title="'新增 PPF 配置'"
          preset="dialog"
          :positive-text="'確認'"
          :negative-text="'取消'"
          @positive-click="handleSubmit"
          @negative-click="showModal = false"
        >
          <n-form
            ref="formRef"
            :model="formValue"
            :rules="rules"
            label-placement="left"
            :label-width="120"
          >
            <n-form-item label="療法名稱" path="treatmentTemplateName">
              <n-select
                v-model:value="formValue.treatmentTemplateName"
                :options="treatmentOptions"
                placeholder="選擇療法名稱"
              />
            </n-form-item>

            <n-form-item label="職位類型" path="roleType">
              <n-select
                v-model:value="formValue.roleType"
                :options="roleOptions"
                placeholder="選擇職位類型"
              />
            </n-form-item>

            <n-form-item label="分潤比例 (%)" path="percentage">
              <n-input-number
                v-model:value="formValue.percentage"
                :min="0"
                :max="100"
                placeholder="0-100"
              />
            </n-form-item>

            <n-form-item label="優先級" path="priority">
              <n-input-number
                v-model:value="formValue.priority"
                :min="1"
                placeholder="優先級"
              />
            </n-form-item>
          </n-form>
        </n-modal>
      </div>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import {
  NButton,
  NDataTable,
  NCard,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NInputNumber,
  NMessageProvider,
  NDialogProvider,
  useMessage,
  useDialog,
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { ppfConfigApi } from '@/services/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const message = useMessage();
const dialog = useDialog();
const formRef = ref<FormInst | null>(null);

const loading = ref(false);
const configs = ref<any[]>([]);
const showModal = ref(false);

const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const formValue = ref({
  treatmentTemplateName: '',
  roleType: '',
  percentage: 0,
  priority: 1,
  clinicId: '',
});

const treatmentOptions = [
  { label: '玻尿酸注射', value: '玻尿酸注射' },
  { label: '去角質療程', value: '去角質療程' },
  { label: '肌膚護理', value: '肌膚護理' },
];

const roleOptions = [
  { label: '醫生', value: 'doctor' },
  { label: '治療師', value: 'therapist' },
  { label: '美容師', value: 'beautician' },
  { label: '助理', value: 'assistant' },
];

const rules: FormRules = {
  treatmentTemplateName: [
    { required: true, message: '療法名稱必選', trigger: 'change' },
  ],
  roleType: [{ required: true, message: '職位類型必選', trigger: 'change' }],
  percentage: [
    { required: true, message: '分潤比例必填', trigger: 'change' },
  ],
};

const pagination = { pageSize: 10 };

const columns: DataTableColumns = [
  { title: '療法名稱', key: 'treatmentTemplateName', width: 150 },
  { title: '職位', key: 'roleType', width: 100 },
  { title: '分潤比例', key: 'percentage', width: 120, render: (row) => `${row.percentage}%` },
  { title: '優先級', key: 'priority', width: 100 },
  {
    title: '操作',
    width: 150,
    render: (row) =>
      h('div', [
        h(NButton, {
          type: 'error',
          text: true,
          onClick: () => handleDelete(row),
        }, { default: () => '刪除' }),
      ]),
  },
];

const loadConfigs = async () => {
  loading.value = true;
  try {
    const response = await ppfConfigApi.getAll(clinicId.value);
    configs.value = response.data;
  } catch (error) {
    message.error('載入 PPF 配置失敗');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  try {
    await ppfConfigApi.create({
      ...formValue.value,
      clinicId: clinicId.value,
    });
    message.success('新增成功');
    showModal.value = false;
    await loadConfigs();
  } catch (error) {
    message.error('新增失敗');
  }
};

const handleDelete = (row: any) => {
  dialog.warning({
    title: '確認刪除',
    content: `確定要刪除 ${row.treatmentTemplateName} - ${row.roleType} 的配置嗎？`,
    positiveText: '確定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await ppfConfigApi.delete(row.id, clinicId.value);
        message.success('刪除成功');
        await loadConfigs();
      } catch (error) {
        message.error('刪除失敗');
      }
    },
  });
};

onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.ppf-config-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
```

**Step 4: 添加路由**

Modify `frontend/src/router/index.ts`:

```typescript
import PPFConfigView from '@/views/PPFConfigView.vue';

const routes = [
  // ... 其他路由
  {
    path: '/ppf-config',
    name: 'PPFConfig',
    component: PPFConfigView,
  },
];
```

**Step 5: 測試**

```bash
npm run dev
# 訪問 http://localhost:5173/ppf-config
```

**Step 6: 提交**

```bash
git add frontend/src/views/PPFConfigView.vue
git add frontend/src/services/api/ppf-config-api.ts
git add frontend/src/services/api.ts
git add frontend/src/router/index.ts
git commit -m "feat: add PPF configuration management frontend"
```

---

## 最終步驟：構建驗證與文檔更新

**Task 5: 構建驗證**

```bash
# 後端構建
cd backend && npm run build

# 前端構建
cd ../frontend && npm run build

# 運行測試（如有）
npm test
```

**Task 6: 更新計劃與進度文檔**

在完成所有功能後，提交一個總結 commit：

```bash
git add CRMplan.md progress.md
git commit -m "docs: update project plan and progress with new frontend features"
```

---

## 總結

此計劃包含 4 個主要功能的完整實現路徑：

1. ✅ **患者搜尋框** - 前端實現全欄位搜尋（2-3 小時）
2. ✅ **療程模板管理** - 後端 API + 前端頁面（3-4 小時）
3. ✅ **療程次數管理** - 擴展數據模型 + 詳細 UI 組件（4-5 小時）
4. ✅ **PPF 分潤配置** - 後端 API + 前端設定頁面（3-4 小時）

**預計總時間**：12-16 小時（分散在多天開發）

**後續步驟**：完成實現後，進行完整的集成測試和部署驗證。
