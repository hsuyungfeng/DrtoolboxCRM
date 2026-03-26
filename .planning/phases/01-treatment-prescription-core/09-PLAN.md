---
phase: 01-treatment-prescription-core
plan: 09
type: execute
wave: 3
depends_on: [04]
files_modified:
  - frontend/src/views/MedicalOrderList.vue
  - frontend/src/views/MedicalOrderDetail.vue
  - frontend/src/components/MedicalOrderForm.vue
  - frontend/src/services/medical-orders-api.ts
autonomous: true
requirements: [SCRIPT-01, SCRIPT-02, SCRIPT-03]
must_haves:
  truths:
    - 醫師能創建和管理醫令
    - 患者能查看已開立的醫令
    - 醫令使用進度可追蹤
  artifacts:
    - path: frontend/src/views/MedicalOrderList.vue
      provides: 醫令列表頁面
      contains: "<template>"
    - path: frontend/src/components/MedicalOrderForm.vue
      provides: 醫令表單
      contains: "script"

---

<objective>
建立前端醫令管理 UI，支持醫師創建/管理醫令、患者查看醫令和使用進度。

**Purpose:**
提供醫令管理的用戶界面。

**Output:**
MedicalOrderList、MedicalOrderForm、MedicalOrderDetail 組件。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 醫令 UI 架構

醫師視圖：
- /medical-orders - 醫令列表（所有患者）
- /medical-orders/new - 創建醫令
- /medical-orders/:id - 詳情

患者視圖：
- /patient/medical-orders - 我的醫令
- /patient/medical-orders/:id - 詳情（唯讀）

## 狀態視覺化

- pending：灰色，未開始
- in_progress：藍色，進行中
- completed：綠色，已完成
- cancelled：紅色，已取消
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 MedicalOrderForm 和 MedicalOrderList 組件</name>
  <files>
    - frontend/src/views/MedicalOrderList.vue
    - frontend/src/components/MedicalOrderForm.vue
    - frontend/src/services/medical-orders-api.ts
  </files>

  <read_first>
    - frontend/src/components/TreatmentForm.vue
  </read_first>

  <action>
建立醫令前端組件：

**medical-orders-api.ts**

```typescript
import { apiClient } from '@/services/api';

export const medicalOrdersApi = {
  createOrder: (data) =>
    apiClient.post('/api/medical-orders', data),

  getOrder: (id) =>
    apiClient.get(`/api/medical-orders/${id}`),

  updateOrder: (id, data) =>
    apiClient.patch(`/api/medical-orders/${id}`, data),

  getPatientOrders: (patientId, status?) =>
    apiClient.get(`/api/patients/${patientId}/medical-orders`, {
      params: { status },
    }),

  recordUsage: (id, usedCount) =>
    apiClient.post(`/api/medical-orders/${id}/use`, {
      usedCount,
    }),

  cancelOrder: (id) =>
    apiClient.delete(`/api/medical-orders/${id}`),
};
```

**MedicalOrderForm.vue**

```vue
<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="top"
  >
    <n-form-item label="患者" path="patientId">
      <n-select
        v-model:value="formData.patientId"
        :options="patientOptions"
        filterable
        clearable
        placeholder="搜尋患者..."
        @search="handlePatientSearch"
      />
    </n-form-item>

    <n-form-item label="藥物或治療名稱" path="藥物或治療名稱">
      <n-input v-model:value="formData.藥物或治療名稱" />
    </n-form-item>

    <n-form-item label="說明" path="說明">
      <n-input
        v-model:value="formData.說明"
        type="textarea"
        rows="3"
      />
    </n-form-item>

    <n-form-item label="劑量" path="劑量">
      <n-input v-model:value="formData.劑量" placeholder="e.g. 500mg x 3" />
    </n-form-item>

    <n-form-item label="使用方式" path="使用方式">
      <n-input v-model:value="formData.使用方式" placeholder="e.g. 口服" />
    </n-form-item>

    <n-form-item label="療程數" path="療程數">
      <n-input-number v-model:value="formData.療程數" :min="1" />
    </n-form-item>

    <div class="form-actions">
      <n-button type="primary" @click="handleSave">保存</n-button>
      <n-button @click="$emit('cancel')">取消</n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { patientApi } from '@/services/patients-api';

const props = defineProps({
  order: Object,
});

const emit = defineEmits(['save', 'cancel']);

const formRef = ref();
const patientOptions = ref([]);

const formData = reactive({
  patientId: '',
  藥物或治療名稱: '',
  說明: '',
  劑量: '',
  使用方式: '',
  療程數: 1,
});

const rules = {
  patientId: { required: true, message: '請選擇患者' },
  藥物或治療名稱: { required: true, message: '請填寫藥物或治療名稱' },
  劑量: { required: true, message: '請填寫劑量' },
  使用方式: { required: true, message: '請填寫使用方式' },
  療程數: { required: true, message: '請填寫療程數' },
};

const handlePatientSearch = async (keyword) => {
  if (keyword.length > 0) {
    try {
      const response = await patientApi.search(keyword);
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
  () => props.order,
  (order) => {
    if (order) {
      Object.assign(formData, order);
    }
  },
  { immediate: true }
);
</script>
```

**MedicalOrderList.vue**

```vue
<template>
  <div class="medical-order-list">
    <n-card title="醫令管理">
      <template #header-extra>
        <n-button type="primary" @click="openCreateDialog">
          開立醫令
        </n-button>
      </template>

      <n-tabs>
        <n-tab-pane name="all" tab="全部">
          <OrderTable
            :orders="allOrders"
            :loading="loading"
            @edit="openEditDialog"
            @delete="handleDelete"
          />
        </n-tab-pane>
        <n-tab-pane name="pending" tab="待開始">
          <OrderTable
            :orders="pendingOrders"
            :loading="loading"
            @edit="openEditDialog"
          />
        </n-tab-pane>
        <n-tab-pane name="in_progress" tab="進行中">
          <OrderTable
            :orders="inProgressOrders"
            :loading="loading"
            @edit="openEditDialog"
          />
        </n-tab-pane>
        <n-tab-pane name="completed" tab="已完成">
          <OrderTable :orders="completedOrders" :loading="loading" />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 表單對話框 -->
    <n-modal
      v-model:show="showFormDialog"
      title="醫令"
      preset="dialog"
      size="large"
    >
      <MedicalOrderForm
        :order="editingOrder"
        @save="handleSave"
        @cancel="closeFormDialog"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { medicalOrdersApi } from '@/services/medical-orders-api';
import MedicalOrderForm from '@/components/MedicalOrderForm.vue';
import OrderTable from '@/components/OrderTable.vue';

const message = useMessage();
const orders = ref([]);
const loading = ref(false);
const showFormDialog = ref(false);
const editingOrder = ref(null);

const allOrders = computed(() => orders.value);
const pendingOrders = computed(() =>
  orders.value.filter((o) => o.status === 'pending')
);
const inProgressOrders = computed(() =>
  orders.value.filter((o) => o.status === 'in_progress')
);
const completedOrders = computed(() =>
  orders.value.filter((o) => o.status === 'completed')
);

const loadOrders = async () => {
  loading.value = true;
  try {
    const response = await medicalOrdersApi.getOrders();
    orders.value = response.data;
  } catch (error) {
    message.error('載入醫令失敗');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingOrder.value = null;
  showFormDialog.value = true;
};

const openEditDialog = (order) => {
  editingOrder.value = { ...order };
  showFormDialog.value = true;
};

const closeFormDialog = () => {
  showFormDialog.value = false;
  editingOrder.value = null;
};

const handleSave = async (data) => {
  try {
    if (editingOrder.value?.id) {
      await medicalOrdersApi.updateOrder(editingOrder.value.id, data);
      message.success('醫令已更新');
    } else {
      await medicalOrdersApi.createOrder(data);
      message.success('醫令已開立');
    }
    closeFormDialog();
    loadOrders();
  } catch (error) {
    message.error('操作失敗');
  }
};

const handleDelete = async (id) => {
  try {
    await medicalOrdersApi.cancelOrder(id);
    message.success('醫令已取消');
    loadOrders();
  } catch (error) {
    message.error('取消失敗');
  }
};

onMounted(loadOrders);
</script>
```

設計：
- MedicalOrderForm：表單支持建立和編輯
- MedicalOrderList：標籤頁按狀態分類醫令
- 患者搜尋整合表單
  </action>

  <verify>
    - [ ] 檔案存在：test -f frontend/src/views/MedicalOrderList.vue
    - [ ] 檔案存在：test -f frontend/src/components/MedicalOrderForm.vue
    - [ ] 包含標籤：grep -q "n-tabs" frontend/src/views/MedicalOrderList.vue
  </verify>

  <done>
- MedicalOrderList 組件完成
- MedicalOrderForm 組件完成
- 狀態標籤頁完成
  </done>
</task>

<task type="auto">
  <name>任務 2：建立 MedicalOrderDetail 組件</name>
  <files>frontend/src/views/MedicalOrderDetail.vue</files>

  <read_first>
    - frontend/src/views/TreatmentDetail.vue
  </read_first>

  <action>
建立醫令詳情頁面：

```vue
<template>
  <div class="medical-order-detail">
    <n-card v-if="order">
      <template #header>
        <h1>{{ order.藥物或治療名稱 }}</h1>
      </template>

      <n-grid cols="2" responsive="screen" x-gap="12" y-gap="12">
        <n-gi><strong>患者：</strong> {{ order.patientName }}</n-gi>
        <n-gi>
          <strong>狀態：</strong>
          <n-tag :type="getStatusType(order.status)">
            {{ getStatusLabel(order.status) }}
          </n-tag>
        </n-gi>
        <n-gi><strong>劑量：</strong> {{ order.劑量 }}</n-gi>
        <n-gi><strong>使用方式：</strong> {{ order.使用方式 }}</n-gi>
      </n-grid>

      <n-divider />

      <div class="progress-section">
        <h3>使用進度</h3>
        <div class="progress-info">
          <span>{{ order.已使用數 }} / {{ order.療程數 }} 已使用</span>
          <span class="percentage">{{ getProgressPercent(order) }}%</span>
        </div>
        <n-progress
          :percentage="getProgressPercent(order)"
          type="line"
          color="#4CAF50"
        />
      </div>

      <n-divider />

      <div class="actions">
        <n-button-group>
          <n-button
            v-if="order.status === 'pending'"
            type="primary"
            @click="handleStatusChange('in_progress')"
          >
            開始使用
          </n-button>
          <n-button
            v-if="order.status === 'in_progress'"
            type="primary"
            @click="showRecordDialog = true"
          >
            記錄使用
          </n-button>
          <n-button
            v-if="['pending', 'in_progress'].includes(order.status)"
            type="error"
            @click="handleCancel"
          >
            取消
          </n-button>
        </n-button-group>
      </div>
    </n-card>

    <!-- 記錄使用對話框 -->
    <n-modal
      v-model:show="showRecordDialog"
      title="記錄使用"
      preset="dialog"
    >
      <n-form label-placement="top">
        <n-form-item label="使用次數">
          <n-input-number
            v-model:value="recordData.usedCount"
            :min="1"
            :max="order.療程數 - order.已使用數"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showRecordDialog = false">取消</n-button>
        <n-button type="primary" @click="handleRecordUsage">確認</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMessage } from 'naive-ui';
import { medicalOrdersApi } from '@/services/medical-orders-api';

const route = useRoute();
const message = useMessage();
const order = ref(null);
const showRecordDialog = ref(false);
const recordData = ref({ usedCount: 1 });

const loadOrder = async () => {
  try {
    const response = await medicalOrdersApi.getOrder(route.params.id);
    order.value = response.data;
  } catch (error) {
    message.error('載入醫令失敗');
  }
};

const getStatusType = (status) => {
  const types = {
    pending: 'default',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
  };
  return types[status] || 'default';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: '待開始',
    in_progress: '進行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status] || status;
};

const getProgressPercent = (order) => {
  if (order.療程數 === 0) return 0;
  return Math.round((order.已使用數 / order.療程數) * 100);
};

const handleStatusChange = async (newStatus) => {
  try {
    await medicalOrdersApi.updateOrder(order.value.id, {
      status: newStatus,
    });
    message.success('狀態已更新');
    loadOrder();
  } catch (error) {
    message.error('更新失敗');
  }
};

const handleRecordUsage = async () => {
  try {
    await medicalOrdersApi.recordUsage(
      order.value.id,
      recordData.value.usedCount
    );
    message.success('使用進度已記錄');
    showRecordDialog.value = false;
    loadOrder();
  } catch (error) {
    message.error('記錄失敗');
  }
};

const handleCancel = async () => {
  try {
    await medicalOrdersApi.cancelOrder(order.value.id);
    message.success('醫令已取消');
    loadOrder();
  } catch (error) {
    message.error('取消失敗');
  }
};

onMounted(loadOrder);
</script>
```

設計：
- 詳情頁面顯示醫令完整資訊
- 進度條視覺化使用進度
- 狀態按鈕支持狀態轉換
- 記錄使用對話框
  </action>

  <verify>
    - [ ] 檔案存在：test -f frontend/src/views/MedicalOrderDetail.vue
    - [ ] 包含進度條：grep -q "n-progress" frontend/src/views/MedicalOrderDetail.vue
    - [ ] 包含狀態標籤：grep -q "n-tag" frontend/src/views/MedicalOrderDetail.vue
  </verify>

  <done>
- MedicalOrderDetail 組件完成
- 進度追蹤功能完成
  </done>
</task>

</tasks>

<verification>
**UI 驗證：**
- 醫令列表按狀態分類
- 詳情頁面顯示完整資訊
- 進度條正確計算百分比
- 狀態轉換按鈕正常

**互動驗證：**
- 能夠開立新醫令
- 能夠記錄使用進度
- 狀態自動轉換
</verification>

<success_criteria>
- [ ] MedicalOrderList 組件完成
- [ ] MedicalOrderForm 組件完成
- [ ] MedicalOrderDetail 組件完成
- [ ] 醫令狀態視覺化
- [ ] 進度追蹤功能
- [ ] 所有操作連接到後端
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/09-SUMMARY.md`
</output>

