<template>
  <n-dialog-provider>
    <n-message-provider>
      <div class="staff-view">
    <div class="page-header">
      <h1>員工管理</h1>
      <n-space>
         <n-button type="primary" @click="openCreateModal">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
          </template>
          新增員工
        </n-button>
        <n-button secondary @click="loadStaff">
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
        :data="staffList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
      />
    </n-card>

    <!-- 新增員工模態框 -->
    <n-modal
      v-model:show="showCreateModal"
      preset="dialog"
       :title="isEditMode ? '編輯員工' : '新增員工'"
      positive-text="確認"
      negative-text="取消"
       @positive-click="handleSave"
    >
      <n-form ref="formRef" :model="formValue" :rules="rules">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formValue.name" placeholder="請輸入員工姓名" />
        </n-form-item>
        <n-form-item label="角色" path="role">
          <n-select
            v-model:value="formValue.role"
            :options="roleOptions"
            placeholder="請選擇角色"
          />
        </n-form-item>
        <n-form-item label="專科" path="specialty">
          <n-input v-model:value="formValue.specialty" placeholder="請輸入專科領域" />
        </n-form-item>
        <n-form-item label="電話" path="phone">
          <n-input v-model:value="formValue.phone" placeholder="請輸入電話號碼" />
        </n-form-item>
        <n-form-item label="郵箱" path="email">
          <n-input v-model:value="formValue.email" placeholder="請輸入電子郵箱" />
        </n-form-item>
        <n-form-item label="基本薪資" path="baseSalary">
          <n-input-number
            v-model:value="formValue.baseSalary"
            placeholder="請輸入基本薪資"
            :min="0"
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
  NButton, NTag, NSpace, NIcon, NDataTable, NCard, NModal,
  NForm, NFormItem, NInput, NSelect, NInputNumber,
  NDialogProvider, useDialog, NMessageProvider, useMessage,
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules, SelectOption } from 'naive-ui';
import type { Staff } from '@/types';
import { staffApi } from '@/services/api';
import { useUserStore } from '@/stores/user';

const loading = ref(false);
const staffList = ref<Staff[]>([]);
const showCreateModal = ref(false);

const formRef = ref<FormInst | null>(null);
const formValue = ref({
  name: '',
  role: 'assistant' as Staff['role'],
  specialty: '',
  phone: '',
  email: '',
  baseSalary: 0,
});
const isEditMode = ref(false);
const currentStaffId = ref('');


// 初始化 Naive UI 工具
const dialog = useDialog();
const message = useMessage();
const userStore = useUserStore();

// 計算 clinicId，優先使用 store 中的值，否則使用默認值
const clinicId = computed(() => {
  return userStore.clinicId || 'clinic_001';
});

const roleOptions: SelectOption[] = [
  { label: '醫生', value: 'doctor' },
  { label: '治療師', value: 'therapist' },
  { label: '助理', value: 'assistant' },
  { label: '顧問', value: 'consultant' },
  { label: '管理員', value: 'admin' },
];

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名長度需在 2 到 50 個字符之間', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '請選擇角色', trigger: 'change' },
  ],
  phone: [
    { required: true, message: '請輸入電話', trigger: 'blur' },
    { pattern: /^[0-9+\-() ]+$/, message: '請輸入有效的電話號碼', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '請輸入有效的電子郵箱', trigger: 'blur' },
  ],
  baseSalary: [
    { type: 'number', min: 0, message: '基本薪資必須大於等於 0', trigger: 'blur' },
  ],
};

const pagination = {
  pageSize: 10,
};

const columns: DataTableColumns<Staff> = [
  {
    title: '姓名',
    key: 'name',
  },
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap = {
        doctor: { text: '醫生', type: 'info' as const },
        therapist: { text: '治療師', type: 'success' as const },
        assistant: { text: '助理', type: 'warning' as const },
        consultant: { text: '顧問', type: 'default' as const },
        admin: { text: '管理員', type: 'error' as const },
      };
      const role = roleMap[row.role];
      return h(NTag, { type: role.type }, { default: () => role.text });
    },
  },
  {
    title: '專科',
    key: 'specialty',
    render(row) {
      return h('span', row.specialty || '-');
    },
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
    title: '基本薪資',
    key: 'baseSalary',
    render(row) {
      return row.baseSalary ? h('span', `$${row.baseSalary.toLocaleString()}`) : h('span', '-');
    },
  },
  {
    title: '創建時間',
    key: 'createdAt',
    render(row) {
      return new Date(row.createdAt).toLocaleDateString();
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
       return h(NSpace, {}, [
         h(NButton, {
           size: 'small',
           onClick: () => viewStaff(row.id),
         }, { default: () => '查看' }),
         h(NButton, {
           size: 'small',
           type: 'warning',
           onClick: () => openEditModal(row),
         }, { default: () => '編輯' }),
         h(NButton, {
           size: 'small',
           type: 'error',
           onClick: () => confirmDelete(row),
         }, { default: () => '刪除' }),
       ]);
    },
  },
];

// 生命周期
onMounted(async () => {
  await loadStaff();
});

// 方法
async function loadStaff() {
  try {
    loading.value = true;
    staffList.value = await staffApi.getAll(clinicId.value);
  } catch (error) {
    console.error('加載員工數據失敗:', error);
    message.error('加載員工數據失敗');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  formValue.value = {
    name: '',
    role: 'assistant',
    specialty: '',
    phone: '',
    email: '',
    baseSalary: 0,
  };
  currentStaffId.value = '';
  isEditMode.value = false;
}

function openCreateModal() {
  resetForm();
  isEditMode.value = false;
  showCreateModal.value = true;
}

function openEditModal(staff: Staff) {
  resetForm();
  isEditMode.value = true;
  currentStaffId.value = staff.id;
  formValue.value = {
    name: staff.name,
    role: staff.role,
    specialty: staff.specialty || '',
    phone: staff.phone || '',
    email: staff.email || '',
    baseSalary: staff.baseSalary || 0,
  };
  showCreateModal.value = true;
}

async function handleSave() {
  try {
    if (!formRef.value) return;
    await formRef.value.validate();
    
    const staffData = {
      ...formValue.value,
      clinicId: clinicId.value,
    };
    
    if (isEditMode.value && currentStaffId.value) {
      await staffApi.update(currentStaffId.value, staffData);
      message.success('員工更新成功');
    } else {
      await staffApi.create(staffData);
      message.success('員工創建成功');
    }
    
    showCreateModal.value = false;
    resetForm();
    await loadStaff();
  } catch (error) {
    console.error('保存員工失敗:', error);
    message.error('保存員工失敗');
  }
}

function confirmDelete(staff: Staff) {
  dialog.warning({
    title: '確認刪除',
    content: '確定要刪除此員工嗎？此操作無法撤銷。',
    positiveText: '刪除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await staffApi.delete(staff.id);
        message.success('員工刪除成功');
        await loadStaff();
      } catch (error) {
        console.error('刪除員工失敗:', error);
        message.error('刪除員工失敗');
      }
    },
  });
}

function viewStaff(id: string) {
  // TODO: 實現查看員工詳情
  console.log('查看員工:', id);
}
</script>

<style scoped>
.staff-view {
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