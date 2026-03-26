---
phase: 01-treatment-prescription-core
plan: 08
type: execute
wave: 3
depends_on: [04, 05, 06]
files_modified:
  - frontend/src/views/TreatmentList.vue
  - frontend/src/views/TreatmentDetail.vue
  - frontend/src/components/TreatmentForm.vue
  - frontend/src/components/TreatmentProgressBar.vue
  - frontend/src/services/treatments-api.ts
autonomous: true
requirements: [COURSE-01, COURSE-02, COURSE-03, COURSE-04, COURSE-05]
must_haves:
  truths:
    - 醫護人員能創建和編輯療程
    - 患者能查看療程列表和進度
    - 進度可視化正確顯示百分比
  artifacts:
    - path: frontend/src/views/TreatmentList.vue
      provides: 療程列表頁面
      contains: "<template>"
    - path: frontend/src/components/TreatmentForm.vue
      provides: 療程創建/編輯表單
      contains: "script"

---

<objective>
建立前端療程管理 UI 組件，支持醫護人員創建/編輯療程、患者查看療程和進度。

**Purpose:**
提供用戶友好的療程管理界面。

**Output:**
TreatmentList、TreatmentDetail、TreatmentForm、TreatmentProgressBar 組件。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 前端框架

- Vue 3：UI 框架
- Naive UI：組件庫
- Pinia：狀態管理
- Axios：API 客戶端

## 頁面結構

醫護視圖：
- /treatments - 療程列表（所有患者）
- /treatments/:id - 療程詳情
- /treatments/new - 創建療程
- /treatments/:id/edit - 編輯療程

患者視圖：
- /patient/treatments - 我的療程
- /patient/treatments/:id - 療程詳情（唯讀）
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 TreatmentList 和 TreatmentForm 組件</name>
  <files>
    - frontend/src/views/TreatmentList.vue
    - frontend/src/components/TreatmentForm.vue
    - frontend/src/services/treatments-api.ts
  </files>

  <read_first>
    - frontend/src/views/PatientList.vue
    - frontend/src/components/PatientForm.vue
  </read_first>

  <action>
建立 Vue 3 元件用於療程管理：

**TreatmentList.vue** - 療程列表頁面（醫護人員視圖）

```vue
<template>
  <div class="treatment-list">
    <n-card title="療程管理">
      <template #header-extra>
        <n-button type="primary" @click="openCreateDialog">
          新增療程
        </n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="treatments"
        :loading="loading"
        striped
        @update:checked-row-keys="handleChecked"
      />
    </n-card>

    <!-- 建立/編輯對話框 -->
    <n-modal
      v-model:show="showFormDialog"
      title="療程資訊"
      preset="dialog"
      size="large"
    >
      <TreatmentForm
        :treatment="editingTreatment"
        @save="handleSave"
        @cancel="closeFormDialog"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { treatmentsApi } from '@/services/treatments-api';
import TreatmentForm from '@/components/TreatmentForm.vue';

const message = useMessage();
const treatments = ref([]);
const loading = ref(false);
const showFormDialog = ref(false);
const editingTreatment = ref(null);

const columns = [
  { key: 'name', title: '療程名稱' },
  { key: 'patientName', title: '患者' },
  { key: 'totalSessions', title: '療程數' },
  { key: 'progress', title: '進度' },
  { key: 'status', title: '狀態' },
  { key: 'createdAt', title: '建立日期', width: 150 },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    render: (row) => (
      <>
        <n-button
          text
          type="primary"
          onClick={() => openEditDialog(row)}
        >
          編輯
        </n-button>
        <n-button
          text
          type="error"
          onClick={() => handleDelete(row.id)}
        >
          刪除
        </n-button>
      </>
    ),
  },
];

const loadTreatments = async () => {
  loading.value = true;
  try {
    const response = await treatmentsApi.getTreatments();
    treatments.value = response.data;
  } catch (error) {
    message.error('載入療程失敗');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingTreatment.value = null;
  showFormDialog.value = true;
};

const openEditDialog = (treatment) => {
  editingTreatment.value = { ...treatment };
  showFormDialog.value = true;
};

const closeFormDialog = () => {
  showFormDialog.value = false;
  editingTreatment.value = null;
};

const handleSave = async (data) => {
  try {
    if (editingTreatment.value?.id) {
      await treatmentsApi.updateTreatment(editingTreatment.value.id, data);
      message.success('療程已更新');
    } else {
      await treatmentsApi.createTreatment(data);
      message.success('療程已建立');
    }
    closeFormDialog();
    loadTreatments();
  } catch (error) {
    message.error('操作失敗');
  }
};

const handleDelete = async (id) => {
  try {
    await treatmentsApi.deleteTreatment(id);
    message.success('療程已刪除');
    loadTreatments();
  } catch (error) {
    message.error('刪除失敗');
  }
};

onMounted(loadTreatments);
</script>
```

**TreatmentForm.vue** - 療程創建/編輯表單

```vue
<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="top"
  >
    <n-form-item label="患者" path="patientId">
      <n-input-group>
        <n-input
          v-model:value="patientSearch"
          placeholder="搜尋患者..."
          @input="handlePatientSearch"
        />
        <n-select
          v-model:value="formData.patientId"
          :options="patientOptions"
          filterable
          clearable
        />
      </n-input-group>
    </n-form-item>

    <n-form-item label="療程名稱" path="name">
      <n-input v-model:value="formData.name" />
    </n-form-item>

    <n-form-item label="類型" path="type">
      <n-select
        v-model:value="formData.type"
        :options="typeOptions"
      />
    </n-form-item>

    <n-form-item label="費用（每堂課）" path="costPerSession">
      <n-input-number v-model:value="formData.costPerSession" />
    </n-form-item>

    <n-form-item label="療程數（總課程數）" path="totalSessions">
      <n-input-number v-model:value="formData.totalSessions" />
    </n-form-item>

    <n-form-item label="說明" path="description">
      <n-input
        v-model:value="formData.description"
        type="textarea"
        rows="4"
      />
    </n-form-item>

    <div class="form-actions">
      <n-button type="primary" @click="handleSave">
        保存
      </n-button>
      <n-button @click="$emit('cancel')">
        取消
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { patientApi } from '@/services/patients-api';

const props = defineProps({
  treatment: Object,
});

const emit = defineEmits(['save', 'cancel']);

const formRef = ref();
const patientSearch = ref('');
const patientOptions = ref([]);

const formData = reactive({
  patientId: '',
  name: '',
  type: '',
  costPerSession: 0,
  totalSessions: 1,
  description: '',
});

const typeOptions = [
  { label: '復健治療', value: 'rehabilitation' },
  { label: '美容療程', value: 'cosmetic' },
  { label: '牙科療程', value: 'dental' },
  { label: '其他', value: 'other' },
];

const rules = {
  patientId: { required: true, message: '請選擇患者' },
  name: { required: true, message: '請填寫療程名稱' },
  totalSessions: { required: true, message: '請填寫療程數' },
};

const handlePatientSearch = async () => {
  if (patientSearch.value.length > 0) {
    try {
      const response = await patientApi.search(patientSearch.value);
      patientOptions.value = response.data.map((p) => ({
        label: `${p.name} (${p.idNumber})`,
        value: p.id,
      }));
    } catch (error) {
      console.error('患者搜尋失敗');
    }
  }
};

const handleSave = async () => {
  await formRef.value?.validate();
  emit('save', formData);
};

watch(
  () => props.treatment,
  (treatment) => {
    if (treatment) {
      Object.assign(formData, treatment);
    }
  },
  { immediate: true }
);
</script>
```

設計：
- TreatmentList：表格顯示療程列表，支持編輯/刪除
- TreatmentForm：響應式表單，驗證輸入
- 患者搜尋整合到表單中
- 支持建立和編輯模式
  </action>

  <verify>
    - [ ] TreatmentList.vue 存在：test -f frontend/src/views/TreatmentList.vue
    - [ ] TreatmentForm.vue 存在：test -f frontend/src/components/TreatmentForm.vue
    - [ ] 包含 n-data-table：grep -q "n-data-table" frontend/src/views/TreatmentList.vue
    - [ ] 包含 n-form：grep -q "n-form" frontend/src/components/TreatmentForm.vue
  </verify>

  <done>
- TreatmentList 組件完成
- TreatmentForm 組件完成
- 患者搜尋整合
  </done>
</task>

<task type="auto">
  <name>任務 2：建立 TreatmentDetail 和 TreatmentProgressBar</name>
  <files>
    - frontend/src/views/TreatmentDetail.vue
    - frontend/src/components/TreatmentProgressBar.vue
  </files>

  <read_first>
    - frontend/src/views/TreatmentList.vue
  </read_first>

  <action>
建立詳情頁面和進度條組件：

**TreatmentProgressBar.vue**

```vue
<template>
  <div class="progress-container">
    <div class="progress-info">
      <span>{{ completed }} / {{ total }} 已完成</span>
      <span class="percentage">{{ progressPercent }}%</span>
    </div>
    <n-progress
      :percentage="progressPercent"
      :height="24"
      :rail-size="8"
      type="line"
      color="#4CAF50"
      rail-color="#E0E0E0"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
});

const progressPercent = computed(
  () => total.value > 0 ? Math.round((completed.value / total.value) * 100) : 0
);
</script>

<style scoped>
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.percentage {
  font-weight: bold;
  color: #4CAF50;
}
</style>
```

**TreatmentDetail.vue**

```vue
<template>
  <div class="treatment-detail">
    <n-card v-if="treatment">
      <template #header>
        <h1>{{ treatment.name }}</h1>
      </template>

      <n-grid cols="2" responsive="screen" x-gap="12" y-gap="12">
        <n-gi><strong>患者：</strong> {{ treatment.patientName }}</n-gi>
        <n-gi><strong>類型：</strong> {{ treatment.type }}</n-gi>
        <n-gi><strong>狀態：</strong> {{ treatment.status }}</n-gi>
        <n-gi><strong>費用：</strong> NT${{ treatment.costPerSession }}/堂</n-gi>
      </n-grid>

      <TreatmentProgressBar
        :completed="treatment.progress.completedSessions"
        :total="treatment.progress.totalSessions"
      />

      <n-divider />

      <h3>課程列表</h3>
      <n-list bordered>
        <n-list-item v-for="session in treatment.sessions" :key="session.id">
          <template #prefix>
            <n-icon>
              <n-checkbox
                :checked="session.completionStatus === 'completed'"
                @update:checked="handleSessionToggle(session.id, $event)"
              />
            </n-icon>
          </template>
          <span>課程 {{ session.sequenceNumber }}</span>
          <span v-if="session.staffAssignments?.length">
            ({{ session.staffAssignments.map(s => s.staffName).join(', ') }})
          </span>
        </n-list-item>
      </n-list>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { treatmentsApi } from '@/services/treatments-api';
import TreatmentProgressBar from '@/components/TreatmentProgressBar.vue';

const route = useRoute();
const treatment = ref(null);

const loadTreatment = async () => {
  try {
    const response = await treatmentsApi.getTreatment(route.params.id);
    treatment.value = response.data;
  } catch (error) {
    console.error('載入療程失敗');
  }
};

const handleSessionToggle = async (sessionId, completed) => {
  try {
    if (completed) {
      await treatmentsApi.completeSession(sessionId);
      await loadTreatment();
    }
  } catch (error) {
    console.error('更新課程失敗');
  }
};

onMounted(loadTreatment);
</script>
```

設計：
- TreatmentProgressBar：可複用的進度條組件
- TreatmentDetail：詳情頁面，顯示患者、費用、課程列表
- 支持標記課程為完成（自動更新進度）
  </action>

  <verify>
    - [ ] TreatmentDetail.vue 存在：test -f frontend/src/views/TreatmentDetail.vue
    - [ ] TreatmentProgressBar.vue 存在：test -f frontend/src/components/TreatmentProgressBar.vue
    - [ ] 包含進度條元件：grep -q "n-progress" frontend/src/components/TreatmentProgressBar.vue
  </verify>

  <done>
- TreatmentDetail 組件完成
- TreatmentProgressBar 組件完成
- 進度視覺化已實現
  </done>
</task>

</tasks>

<verification>
**UI 驗證：**
- 療程列表顯示所有療程
- 進度條正確計算百分比
- 編輯/刪除按鈕功能正常
- 患者搜尋整合到表單

**互動驗證：**
- 能夠建立新療程
- 能夠編輯療程
- 標記課程完成時進度更新
</verification>

<success_criteria>
- [ ] TreatmentList 組件完成
- [ ] TreatmentForm 組件完成
- [ ] TreatmentDetail 組件完成
- [ ] TreatmentProgressBar 進度視覺化
- [ ] 患者搜尋功能集成
- [ ] 所有操作都連接到後端 API
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/08-SUMMARY.md`
</output>

