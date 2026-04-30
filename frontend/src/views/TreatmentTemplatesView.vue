<template>
  <div class="treatment-templates-view">
    <div class="page-header">
      <h1>療法模板管理</h1>
      <n-space>
        <n-button type="primary" @click="openCreateModal">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
          </template>
          新增模板
        </n-button>
        <n-button secondary @click="loadTemplates">刷新</n-button>
      </n-space>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="templateList"
        :loading="loading"
        :pagination="pagination"
      />
    </n-card>

    <!-- 新增/編輯療法模板模態框 -->
    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      :title="isEditMode ? '編輯療法模板' : '新增療法模板'"
      style="width: 800px"
    >
      <n-form ref="formRef" :model="formValue" :rules="rules">
        <n-tabs type="line" animated>
          <!-- 基本資訊頁籤 -->
          <n-tab-pane name="basic" tab="基本資訊">
            <n-grid :cols="2" :x-gap="12">
              <n-gi :span="2">
                <n-form-item label="模板名稱" path="name">
                  <n-input v-model:value="formValue.name" placeholder="例如：激光美白療程" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="預設價格" path="defaultPrice">
                  <n-input-number v-model:value="formValue.defaultPrice" :min="0" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="預設療程次數" path="defaultSessions">
                  <n-input-number v-model:value="formValue.defaultSessions" :min="1" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="2">
                <n-form-item label="描述" path="description">
                  <n-input v-model:value="formValue.description" type="textarea" :rows="2" />
                </n-form-item>
              </n-gi>
              <n-gi :span="2">
                <n-form-item label="回診提醒間隔 (天數)" path="followUpIntervalDays">
                  <n-input-number v-model:value="formValue.followUpIntervalDays" :min="0" placeholder="療程結束後幾天提醒回診" style="width: 200px" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-tab-pane>

          <!-- 醫令設定頁籤 -->
          <n-tab-pane name="medical-orders" tab="預設醫令明細">
            <n-dynamic-input
              v-model:value="formValue.customMedicalOrders"
              :on-create="onCreateMedicalOrder"
            >
              <template #default="{ value }">
                <div style="display: flex; gap: 8px; width: 100%; align-items: flex-start;">
                  <n-input v-model:value="value.code" placeholder="代碼" style="width: 100px" />
                  <n-input v-model:value="value.nameZh" placeholder="中文名稱" style="flex: 1" />
                  <n-input v-model:value="value.nameEn" placeholder="英文名稱" style="flex: 1" />
                  <n-input-number v-model:value="value.points" placeholder="點數" style="width: 100px" />
                  <n-select
                    v-model:value="value.paymentType"
                    :options="paymentTypeOptions"
                    style="width: 100px"
                  />
                </div>
              </template>
            </n-dynamic-input>
          </n-tab-pane>

          <!-- 分潤人員頁籤 -->
          <n-tab-pane name="revenue" tab="分潤設定 (1-5人)">
            <n-alert type="info" style="margin-bottom: 12px">
              此設定將覆蓋系統預設的分潤規則。您可以設定參與此療程的人員及其分潤方式。
            </n-alert>
            <n-dynamic-input
              v-model:value="formValue.customRevenueRules"
              :on-create="onCreateRevenueRule"
              :max="5"
              :min="1"
            >
              <template #default="{ value }">
                <div style="display: flex; gap: 8px; width: 100%">
                  <n-select
                    v-model:value="value.staffIdOrRole"
                    :options="staffOptions"
                    placeholder="選擇員工"
                    style="flex: 2"
                    filterable
                  />
                  <n-select
                    v-model:value="value.ruleType"
                    :options="ruleTypeOptions"
                    style="flex: 1"
                  />
                  <n-input-number
                    v-model:value="value.value"
                    placeholder="數值"
                    style="flex: 1"
                  >
                    <template #suffix>{{ value.ruleType === 'percentage' ? '%' : '$' }}</template>
                  </n-input-number>
                </div>
              </template>
            </n-dynamic-input>
          </n-tab-pane>
        </n-tabs>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">保存模板</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import {
  NButton, NSpace, NIcon, NDataTable, NCard, NModal, NForm, NFormItem,
  NInput, NInputNumber, useDialog, useMessage, NTabs, NTabPane,
  NDynamicInput, NSelect, NGrid, NGi, NAlert
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { treatmentTemplatesApi, type TreatmentTemplate } from '@/services/treatment-templates-api';
import { staffApi } from '@/services/api';
import { useUserStore } from '@/stores/user';

const loading = ref(false);
const saving = ref(false);
const templateList = ref<TreatmentTemplate[]>([]);
const showCreateModal = ref(false);
const staffList = ref<any[]>([]);

const formRef = ref<FormInst | null>(null);
const formValue = ref({
  name: '',
  description: '',
  defaultPrice: 0,
  defaultSessions: 1,
  followUpIntervalDays: 0,
  customMedicalOrders: [] as any[],
  customRevenueRules: [] as any[],
});

const isEditMode = ref(false);
const currentTemplateId = ref('');

const message = useMessage();
const dialog = useDialog();
const userStore = useUserStore();
const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const paymentTypeOptions = [
  { label: '自費', value: 'self-pay' },
  { label: '健保', value: 'nhi' },
];

const ruleTypeOptions = [
  { label: '百分比', value: 'percentage' },
  { label: '固定金額', value: 'fixed' },
];

const staffOptions = computed(() => {
  const options = staffList.value.map(s => ({ label: `${s.name} (${s.role})`, value: s.id }));
  options.unshift(
    { label: '🔥 動態：執行醫師', value: 'dynamic_doctor' },
    { label: '🔥 動態：執行治療師', value: 'dynamic_therapist' }
  );
  return options;
});

const rules: FormRules = {
  name: [{ required: true, message: '請輸入名稱' }],
};

const pagination = { pageSize: 10 };

const columns: DataTableColumns<TreatmentTemplate> = [
  { title: '模板名稱', key: 'name' },
  { title: '價格', key: 'defaultPrice', render: (row) => `$${row.defaultPrice}` },
  { title: '次數', key: 'defaultSessions' },
  { title: '回診提醒', key: 'followUpIntervalDays', render: (row) => row.followUpIntervalDays ? `${row.followUpIntervalDays}天` : '-' },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        h(NButton, { size: 'small', type: 'warning', onClick: () => openEditModal(row) }, { default: () => '編輯' }),
        h(NButton, { size: 'small', type: 'error', onClick: () => confirmDelete(row) }, { default: () => '刪除' }),
      ]);
    },
  },
];

const onCreateMedicalOrder = () => ({
  code: '',
  nameZh: '',
  nameEn: '',
  points: 0,
  paymentType: 'self-pay', // 預設自費
});

const onCreateRevenueRule = () => ({
  staffIdOrRole: '',
  ruleType: 'percentage',
  value: 0,
});

async function loadTemplates() {
  loading.value = true;
  try {
    templateList.value = await treatmentTemplatesApi.getAll(clinicId.value);
  } finally {
    loading.value = false;
  }
}

async function loadStaff() {
  try {
    staffList.value = await staffApi.getAll(clinicId.value);
  } catch (err) {
    console.error('載入員工失敗');
  }
}

function openCreateModal() {
  isEditMode.value = false;
  formValue.value = {
    name: '',
    description: '',
    defaultPrice: 0,
    defaultSessions: 1,
    followUpIntervalDays: 0,
    customMedicalOrders: [],
    customRevenueRules: [{ staffIdOrRole: '', ruleType: 'percentage', value: 0 }],
  };
  showCreateModal.value = true;
}

function openEditModal(template: TreatmentTemplate) {
  isEditMode.value = true;
  currentTemplateId.value = template.id;
  formValue.value = {
    name: template.name,
    description: template.description || '',
    defaultPrice: template.defaultPrice,
    defaultSessions: template.defaultSessions,
    followUpIntervalDays: template.followUpIntervalDays || 0,
    customMedicalOrders: template.customMedicalOrders || [],
    customRevenueRules: template.customRevenueRules || [{ staffIdOrRole: '', ruleType: 'percentage', value: 0 }],
  };
  showCreateModal.value = true;
}

async function handleSave() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    const data = { ...formValue.value, clinicId: clinicId.value };
    if (isEditMode.value) {
      await treatmentTemplatesApi.update(currentTemplateId.value, clinicId.value, data);
    } else {
      await treatmentTemplatesApi.create(data);
    }
    showCreateModal.value = false;
    loadTemplates();
    message.success('保存成功');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(template: any) {
  dialog.warning({
    title: '刪除',
    content: '確定刪除？',
    positiveText: '確定',
    onPositiveClick: async () => {
      await treatmentTemplatesApi.delete(template.id, clinicId.value);
      loadTemplates();
    }
  });
}

onMounted(() => {
  loadTemplates();
  loadStaff();
});
</script>

<style scoped>
.treatment-templates-view { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
</style>
