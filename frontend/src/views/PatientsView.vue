

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { 
  NButton, 
  NTag, 
  NSpace, 
  NIcon, 
  NDataTable, 
  NCard, 
  NModal, 
  NForm, 
  NFormItem, 
  NInput, 
  NRadioGroup, 
  NRadio,
  NDialogProvider,
  useDialog,
  NMessageProvider,
  useMessage
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import type { Patient } from '@/types';
import { patientsApi } from '@/services/api';
import { useUserStore } from '@/stores/user';

// 初始化 Naive UI 工具
const dialog = useDialog();
const message = useMessage();
const userStore = useUserStore();

const loading = ref(false);
const patients = ref<Patient[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingPatientId = ref<string | null>(null);
const formRef = ref<FormInst | null>(null);
const formValue = ref({
  name: '',
  idNumber: '',
  phone: '',
  email: '',
  gender: 'male' as 'male' | 'female' | 'other',
});

// 搜尋相關的狀態
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref<Patient[]>([]);

// 計算 clinicId，優先使用 store 中的值，否則使用默認值
const clinicId = computed(() => {
  return userStore.clinicId || 'clinic_001';
});

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名長度需在 2 到 50 個字符之間', trigger: 'blur' },
  ],
  idNumber: [
    { max: 20, message: '身份證字號長度不超過 20 個字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '請輸入電話', trigger: 'blur' },
    { pattern: /^[0-9+\-() ]+$/, message: '請輸入有效的電話號碼', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '請輸入有效的電子郵箱', trigger: 'blur' },
  ],
};

const pagination = {
  pageSize: 10,
};

const columns: DataTableColumns<Patient> = [
  {
    title: '姓名',
    key: 'name',
  },
  {
    title: '身份證字號',
    key: 'idNumber',
  },
  {
    title: '電話',
    key: 'phone',
  },
  {
    title: '郵箱',
    key: 'email',
  },
  {
    title: '性別',
    key: 'gender',
    render(row) {
      const genderMap = {
        male: { text: '男', type: 'info' as const },
        female: { text: '女', type: 'warning' as const },
        other: { text: '其他', type: 'default' as const },
      };
      const gender = genderMap[row.gender || 'other'];
      return h(NTag, { type: gender.type }, { default: () => gender.text });
    },
  },
  {
    title: '出生日期',
    key: 'birthDate',
    render(row) {
      return row.birthDate ? new Date(row.birthDate).toLocaleDateString('zh-TW') : '-';
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
        h(NButton, {
          size: 'small',
          onClick: () => viewPatient(row.id),
        }, { default: () => '查看' }),
        h(NButton, {
          size: 'small',
          type: 'warning',
          onClick: () => editPatient(row),
        }, { default: () => '編輯' }),
        h(NButton, {
          size: 'small',
          type: 'error',
          onClick: () => deletePatient(row.id),
        }, { default: () => '刪除' }),
      ]);
    },
  },
];

// 生命周期
onMounted(async () => {
  await loadPatients();
});

// 加載患者列表
async function loadPatients() {
  try {
    loading.value = true;
    patients.value = await patientsApi.getAll(clinicId.value);
  } catch (error) {
    console.error('加載患者數據失敗:', error);
    message.error('加載患者數據失敗');
  } finally {
    loading.value = false;
  }
}

// 查看患者詳情
function viewPatient(id: string) {
  // TODO: 跳轉到患者詳情頁面
  message.info(`查看患者 ${id}`);
}

// 編輯患者
function editPatient(patient: Patient) {
  editingPatientId.value = patient.id;
  formValue.value = {
    name: patient.name,
    idNumber: patient.idNumber || '',
    phone: patient.phone,
    email: patient.email || '',
    gender: patient.gender || 'male',
  };
  showEditModal.value = true;
}

// 刪除患者
function deletePatient(id: string) {
  dialog.warning({
    title: '確認刪除',
    content: '確定要刪除這位患者嗎？此操作無法撤銷。',
    positiveText: '刪除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await patientsApi.delete(id);
        message.success('患者刪除成功');
        await loadPatients();
      } catch (error) {
        console.error('刪除患者失敗:', error);
        message.error('刪除患者失敗');
      }
    },
  });
}

// 創建患者
async function handleCreate() {
  try {
    if (!formRef.value) return;
    await formRef.value.validate();
    
    const patientData = {
      ...formValue.value,
      clinicId: clinicId.value,
    };
    
    await patientsApi.create(patientData);
    message.success('患者創建成功');
    showCreateModal.value = false;
    resetForm();
    await loadPatients();
  } catch (error) {
    console.error('創建患者失敗:', error);
    message.error('創建患者失敗');
  }
}

// 更新患者
async function handleEdit() {
  try {
    if (!formRef.value || !editingPatientId.value) return;
    await formRef.value.validate();
    
    const patientData = {
      ...formValue.value,
      clinicId: clinicId.value,
    };
    
    await patientsApi.update(editingPatientId.value, patientData);
    message.success('患者更新成功');
    showEditModal.value = false;
    resetForm();
    editingPatientId.value = null;
    await loadPatients();
  } catch (error) {
    console.error('更新患者失敗:', error);
    message.error('更新患者失敗');
  }
}

// 重置表單
function resetForm() {
  formValue.value = {
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    gender: 'male',
  };
  if (formRef.value) {
    formRef.value.restoreValidation();
  }
}

// 執行搜尋
async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const query = searchQuery.value.toLowerCase();
    searchResults.value = patients.value.filter(patient => {
      const nameMatch = patient.name?.toLowerCase().includes(query);
      const phoneMatch = patient.phone?.includes(searchQuery.value);
      const idMatch = patient.idNumber?.includes(searchQuery.value);
      const dateMatch = patient.birthDate?.toString().includes(searchQuery.value);

      return nameMatch || phoneMatch || idMatch || dateMatch;
    });
  } catch (error) {
    console.error('搜尋失敗:', error);
    message.error('搜尋失敗');
  } finally {
    isSearching.value = false;
  }
}

// 清除搜尋
function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
}
</script>

<template>
  <n-dialog-provider>
    <n-message-provider>
      <div class="patients-view">
        <div class="page-header">
          <h1>患者管理</h1>
          <n-space>
            <n-button type="primary" @click="showCreateModal = true">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </n-icon>
              </template>
              新增患者
            </n-button>
            <n-button secondary @click="loadPatients">
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

        <div class="search-bar" style="margin: 16px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px;">
          <n-space>
            <n-input
              v-model:value="searchQuery"
              placeholder="輸入患者資訊搜尋：身分證號、姓名、電話或生日"
              clearable
              @keyup.enter="performSearch"
              style="flex: 1;"
            />
            <n-button type="primary" @click="performSearch" :loading="isSearching">
              搜尋
            </n-button>
            <n-button secondary @click="clearSearch">
              清除
            </n-button>
          </n-space>
        </div>

        <n-card>
          <n-data-table
            :columns="columns"
            :data="searchResults.length > 0 ? searchResults : patients"
            :loading="loading"
            :pagination="pagination"
            :row-key="(row) => row.id"
          />
        </n-card>

        <!-- 新增患者模態框 -->
        <n-modal
          v-model:show="showCreateModal"
          preset="dialog"
          title="新增患者"
          positive-text="確認"
          negative-text="取消"
          @positive-click="handleCreate"
          @negative-click="showCreateModal = false"
        >
          <n-form ref="formRef" :model="formValue" :rules="rules">
            <n-form-item label="姓名" path="name">
              <n-input v-model:value="formValue.name" placeholder="請輸入患者姓名" />
            </n-form-item>
            <n-form-item label="身份證字號" path="idNumber">
              <n-input v-model:value="formValue.idNumber" placeholder="請輸入身份證字號" />
            </n-form-item>
            <n-form-item label="電話" path="phone">
              <n-input v-model:value="formValue.phone" placeholder="請輸入電話號碼" />
            </n-form-item>
            <n-form-item label="郵箱" path="email">
              <n-input v-model:value="formValue.email" placeholder="請輸入電子郵箱" />
            </n-form-item>
            <n-form-item label="性別" path="gender">
              <n-radio-group v-model:value="formValue.gender">
                <n-radio value="male">男</n-radio>
                <n-radio value="female">女</n-radio>
                <n-radio value="other">其他</n-radio>
              </n-radio-group>
            </n-form-item>
          </n-form>
        </n-modal>

        <!-- 編輯患者模態框 -->
        <n-modal
          v-model:show="showEditModal"
          preset="dialog"
          :title="`編輯患者 (ID: ${editingPatientId})`"
          positive-text="確認"
          negative-text="取消"
          @positive-click="handleEdit"
          @negative-click="showEditModal = false"
        >
          <n-form ref="formRef" :model="formValue" :rules="rules">
            <n-form-item label="姓名" path="name">
              <n-input v-model:value="formValue.name" placeholder="請輸入患者姓名" />
            </n-form-item>
            <n-form-item label="身份證字號" path="idNumber">
              <n-input v-model:value="formValue.idNumber" placeholder="請輸入身份證字號" />
            </n-form-item>
            <n-form-item label="電話" path="phone">
              <n-input v-model:value="formValue.phone" placeholder="請輸入電話號碼" />
            </n-form-item>
            <n-form-item label="郵箱" path="email">
              <n-input v-model:value="formValue.email" placeholder="請輸入電子郵箱" />
            </n-form-item>
            <n-form-item label="性別" path="gender">
              <n-radio-group v-model:value="formValue.gender">
                <n-radio value="male">男</n-radio>
                <n-radio value="female">女</n-radio>
                <n-radio value="other">其他</n-radio>
              </n-radio-group>
            </n-form-item>
          </n-form>
        </n-modal>
      </div>
    </n-message-provider>
  </n-dialog-provider>
</template>

<style scoped>
.patients-view {
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