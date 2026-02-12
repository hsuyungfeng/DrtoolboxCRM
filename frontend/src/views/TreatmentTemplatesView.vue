<template>
  <n-dialog-provider>
    <n-message-provider>
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
            <n-button secondary @click="loadTemplates">
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
            :data="templateList"
            :loading="loading"
            :pagination="pagination"
            :row-key="(row) => row.id"
          />
        </n-card>

        <!-- 新增/編輯療法模板模態框 -->
        <n-modal
          v-model:show="showCreateModal"
          preset="dialog"
          :title="isEditMode ? '編輯療法模板' : '新增療法模板'"
          positive-text="確認"
          negative-text="取消"
          @positive-click="handleSave"
        >
          <n-form ref="formRef" :model="formValue" :rules="rules">
            <n-form-item label="模板名稱" path="name">
              <n-input v-model:value="formValue.name" placeholder="請輸入療法模板名稱" />
            </n-form-item>
            <n-form-item label="描述" path="description">
              <n-input
                v-model:value="formValue.description"
                placeholder="請輸入模板描述"
                type="textarea"
                :rows="3"
              />
            </n-form-item>
            <n-form-item label="預設價格" path="defaultPrice">
              <n-input-number
                v-model:value="formValue.defaultPrice"
                placeholder="請輸入預設價格"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="預設療程次數" path="defaultSessions">
              <n-input-number
                v-model:value="formValue.defaultSessions"
                placeholder="請輸入預設療程次數"
                :min="1"
                :max="1000"
                style="width: 100%"
              />
            </n-form-item>
          </n-form>
        </n-modal>
      </div>
    </n-message-provider>
  </n-dialog-provider>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import {
  NButton,
  NSpace,
  NIcon,
  NDataTable,
  NCard,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDialogProvider,
  useDialog,
  NMessageProvider,
  useMessage,
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import type { TreatmentTemplate } from '@/services/treatment-templates-api';
import { treatmentTemplatesApi } from '@/services/api';
import { useUserStore } from '@/stores/user';

const loading = ref(false);
const templateList = ref<TreatmentTemplate[]>([]);
const showCreateModal = ref(false);

const formRef = ref<FormInst | null>(null);
const formValue = ref({
  name: '',
  description: '',
  defaultPrice: 0,
  defaultSessions: 1,
});
const isEditMode = ref(false);
const currentTemplateId = ref('');

// 初始化 Naive UI 工具
const dialog = useDialog();
const message = useMessage();
const userStore = useUserStore();

// 計算 clinicId，優先使用 store 中的值，否則使用默認值
const clinicId = computed(() => {
  return userStore.clinicId || 'clinic_001';
});

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入模板名稱', trigger: 'blur' },
    { min: 2, max: 100, message: '名稱長度需在 2 到 100 個字符之間', trigger: 'blur' },
  ],
  defaultPrice: [
    { type: 'number', min: 0, message: '價格必須大於等於 0', trigger: 'blur' },
  ],
  defaultSessions: [
    { type: 'number', min: 1, message: '療程次數必須大於等於 1', trigger: 'blur' },
  ],
};

const pagination = {
  pageSize: 10,
};

const columns: DataTableColumns<TreatmentTemplate> = [
  {
    title: '模板名稱',
    key: 'name',
  },
  {
    title: '預設價格',
    key: 'defaultPrice',
    render(row) {
      return h('span', `$${row.defaultPrice.toFixed(2)}`);
    },
  },
  {
    title: '預設療程次數',
    key: 'defaultSessions',
  },
  {
    title: '描述',
    key: 'description',
    render(row) {
      return h('span', row.description || '-');
    },
  },
  {
    title: '創建時間',
    key: 'createdAt',
    render(row) {
      return new Date(row.createdAt).toLocaleDateString('zh-TW');
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        h(
          NButton,
          {
            size: 'small',
            type: 'warning',
            onClick: () => openEditModal(row),
          },
          { default: () => '編輯' },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            onClick: () => confirmDelete(row),
          },
          { default: () => '刪除' },
        ),
      ]);
    },
  },
];

// 生命周期
onMounted(async () => {
  await loadTemplates();
});

// 方法
async function loadTemplates() {
  try {
    loading.value = true;
    templateList.value = await treatmentTemplatesApi.getAll(clinicId.value);
  } catch (error) {
    console.error('加載療法模板數據失敗:', error);
    message.error('加載療法模板數據失敗');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  formValue.value = {
    name: '',
    description: '',
    defaultPrice: 0,
    defaultSessions: 1,
  };
  currentTemplateId.value = '';
  isEditMode.value = false;
}

function openCreateModal() {
  resetForm();
  isEditMode.value = false;
  showCreateModal.value = true;
}

function openEditModal(template: TreatmentTemplate) {
  resetForm();
  isEditMode.value = true;
  currentTemplateId.value = template.id;
  formValue.value = {
    name: template.name,
    description: template.description || '',
    defaultPrice: template.defaultPrice,
    defaultSessions: template.defaultSessions,
  };
  showCreateModal.value = true;
}

async function handleSave() {
  try {
    if (!formRef.value) return;
    await formRef.value.validate();

    const templateData = {
      ...formValue.value,
      clinicId: clinicId.value,
    };

    if (isEditMode.value && currentTemplateId.value) {
      await treatmentTemplatesApi.update(currentTemplateId.value, clinicId.value, templateData);
      message.success('療法模板更新成功');
    } else {
      await treatmentTemplatesApi.create(templateData);
      message.success('療法模板創建成功');
    }

    showCreateModal.value = false;
    resetForm();
    await loadTemplates();
  } catch (error) {
    console.error('保存療法模板失敗:', error);
    message.error('保存療法模板失敗');
  }
}

function confirmDelete(template: TreatmentTemplate) {
  dialog.warning({
    title: '確認刪除',
    content: `確定要刪除療法模板 "${template.name}" 嗎？此操作無法撤銷。`,
    positiveText: '刪除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await treatmentTemplatesApi.delete(template.id, clinicId.value);
        message.success('療法模板刪除成功');
        await loadTemplates();
      } catch (error) {
        console.error('刪除療法模板失敗:', error);
        message.error('刪除療法模板失敗');
      }
    },
  });
}
</script>

<style scoped>
.treatment-templates-view {
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
