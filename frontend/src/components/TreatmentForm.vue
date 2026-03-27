<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="top"
  >
    <!-- 患者選擇 -->
    <n-form-item label="患者" path="patientId">
      <n-select
        v-model:value="formData.patientId"
        :options="patientOptions"
        filterable
        clearable
        remote
        :loading="searchingPatients"
        placeholder="輸入姓名或身份證號搜尋患者..."
        @search="handlePatientSearch"
      />
    </n-form-item>

    <!-- 療程名稱 -->
    <n-form-item label="療程名稱" path="name">
      <n-input v-model:value="formData.name" placeholder="請輸入療程名稱" />
    </n-form-item>

    <!-- 療程類型 -->
    <n-form-item label="類型" path="type">
      <n-select
        v-model:value="formData.type"
        :options="typeOptions"
        placeholder="請選擇療程類型"
        clearable
      />
    </n-form-item>

    <!-- 每堂費用 -->
    <n-form-item label="費用（每堂課）" path="costPerSession">
      <n-input-number
        v-model:value="formData.costPerSession"
        :min="0"
        :precision="0"
        placeholder="請輸入每堂費用"
        style="width: 100%"
      >
        <template #prefix>NT$</template>
      </n-input-number>
    </n-form-item>

    <!-- 總課程數 -->
    <n-form-item label="療程數（總課程數）" path="totalSessions">
      <n-input-number
        v-model:value="formData.totalSessions"
        :min="1"
        :precision="0"
        placeholder="請輸入總課程數"
        style="width: 100%"
      />
    </n-form-item>

    <!-- 說明 -->
    <n-form-item label="說明" path="description">
      <n-input
        v-model:value="formData.description"
        type="textarea"
        :rows="4"
        placeholder="請輸入療程說明（選填）"
      />
    </n-form-item>

    <!-- 操作按鈕 -->
    <div class="form-actions">
      <n-space justify="end">
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="primary" :loading="saving" @click="handleSave">保存</n-button>
      </n-space>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NButton,
  NSpace,
} from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import { patientsApi } from '@/services/api';

/** 療程表單資料型別 */
interface TreatmentFormData {
  patientId: string;
  name: string;
  type: string;
  costPerSession: number;
  totalSessions: number;
  description: string;
}

/** 父元件傳入的療程資料（編輯模式） */
interface TreatmentProp {
  id?: string;
  patientId?: string;
  name?: string;
  type?: string;
  costPerSession?: number;
  totalSessions?: number;
  description?: string;
}

const props = defineProps<{
  treatment?: TreatmentProp | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: TreatmentFormData): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInst | null>(null);
const saving = ref(false);
const searchingPatients = ref(false);
const patientOptions = ref<SelectOption[]>([]);

const formData = reactive<TreatmentFormData>({
  patientId: '',
  name: '',
  type: '',
  costPerSession: 0,
  totalSessions: 1,
  description: '',
});

/** 療程類型選項 */
const typeOptions: SelectOption[] = [
  { label: '復健治療', value: 'rehabilitation' },
  { label: '美容療程', value: 'cosmetic' },
  { label: '牙科療程', value: 'dental' },
  { label: '其他', value: 'other' },
];

/** 表單驗證規則 */
const rules: FormRules = {
  patientId: [{ required: true, message: '請選擇患者', trigger: 'change' }],
  name: [
    { required: true, message: '請填寫療程名稱', trigger: 'blur' },
    { min: 2, max: 100, message: '療程名稱需在 2 到 100 個字符之間', trigger: 'blur' },
  ],
  totalSessions: [
    { required: true, type: 'number', message: '請填寫療程數', trigger: ['input', 'change'] },
    {
      type: 'number',
      min: 1,
      message: '療程數至少為 1',
      trigger: ['input', 'change'],
    },
  ],
};

/** 搜尋患者（遠端搜尋） */
const handlePatientSearch = async (query: string) => {
  if (!query || query.length < 1) return;
  searchingPatients.value = true;
  try {
    const data = await patientsApi.getAll('', { search: query });
    const list = Array.isArray(data) ? data : [];
    patientOptions.value = list.map((p: { id: string; name: string; idNumber?: string }) => ({
      label: p.idNumber ? `${p.name}（${p.idNumber}）` : p.name,
      value: p.id,
    }));
  } catch (error) {
    console.error('患者搜尋失敗:', error);
  } finally {
    searchingPatients.value = false;
  }
};

/** 保存表單 */
const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    emit('save', { ...formData });
  } finally {
    saving.value = false;
  }
};

/** 監聽傳入的療程資料（編輯模式初始化） */
watch(
  () => props.treatment,
  (treatment) => {
    if (treatment) {
      formData.patientId = treatment.patientId ?? '';
      formData.name = treatment.name ?? '';
      formData.type = treatment.type ?? '';
      formData.costPerSession = treatment.costPerSession ?? 0;
      formData.totalSessions = treatment.totalSessions ?? 1;
      formData.description = treatment.description ?? '';
    } else {
      // 新增模式：重置表單
      formData.patientId = '';
      formData.name = '';
      formData.type = '';
      formData.costPerSession = 0;
      formData.totalSessions = 1;
      formData.description = '';
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
</style>
