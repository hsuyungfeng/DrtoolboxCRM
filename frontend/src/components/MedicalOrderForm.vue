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

    <!-- 藥物或治療名稱 -->
    <n-form-item label="藥物或治療名稱" path="drugOrTreatmentName">
      <n-input
        v-model:value="formData.drugOrTreatmentName"
        placeholder="請輸入藥物或治療名稱"
      />
    </n-form-item>

    <!-- 說明 -->
    <n-form-item label="說明" path="description">
      <n-input
        v-model:value="formData.description"
        type="textarea"
        :rows="3"
        placeholder="請輸入說明（選填）"
      />
    </n-form-item>

    <!-- 劑量 -->
    <n-form-item label="劑量" path="dosage">
      <n-input
        v-model:value="formData.dosage"
        placeholder="例如：500mg x 3"
      />
    </n-form-item>

    <!-- 使用方式 -->
    <n-form-item label="使用方式" path="usageMethod">
      <n-input
        v-model:value="formData.usageMethod"
        placeholder="例如：口服、靜脈注射"
      />
    </n-form-item>

    <!-- 療程數 -->
    <n-form-item label="療程數（總使用次數）" path="totalUsage">
      <n-input-number
        v-model:value="formData.totalUsage"
        :min="1"
        :precision="0"
        placeholder="請輸入總使用次數"
        style="width: 100%"
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
import type { CreateMedicalOrderData, MedicalOrder } from '@/services/medical-orders-api';

/** 醫令表單資料型別 */
interface MedicalOrderFormData {
  patientId: string;
  drugOrTreatmentName: string;
  description: string;
  dosage: string;
  usageMethod: string;
  totalUsage: number;
}

const props = defineProps<{
  order?: MedicalOrder | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: CreateMedicalOrderData): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInst | null>(null);
const saving = ref(false);
const searchingPatients = ref(false);
const patientOptions = ref<SelectOption[]>([]);

const formData = reactive<MedicalOrderFormData>({
  patientId: '',
  drugOrTreatmentName: '',
  description: '',
  dosage: '',
  usageMethod: '',
  totalUsage: 1,
});

/** 表單驗證規則 */
const rules: FormRules = {
  patientId: [{ required: true, message: '請選擇患者', trigger: 'change' }],
  drugOrTreatmentName: [
    { required: true, message: '請填寫藥物或治療名稱', trigger: 'blur' },
    { min: 1, max: 200, message: '名稱需在 1 到 200 個字符之間', trigger: 'blur' },
  ],
  dosage: [{ required: true, message: '請填寫劑量', trigger: 'blur' }],
  usageMethod: [{ required: true, message: '請填寫使用方式', trigger: 'blur' }],
  totalUsage: [
    {
      required: true,
      type: 'number',
      message: '請填寫療程數',
      trigger: ['input', 'change'],
    },
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

/** 保存醫令 */
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

/** 監聽傳入的醫令資料（編輯模式初始化） */
watch(
  () => props.order,
  (order) => {
    if (order) {
      formData.patientId = order.patientId ?? '';
      formData.drugOrTreatmentName = order.drugOrTreatmentName ?? '';
      formData.description = order.description ?? '';
      formData.dosage = order.dosage ?? '';
      formData.usageMethod = order.usageMethod ?? '';
      formData.totalUsage = order.totalUsage ?? 1;
    } else {
      // 新增模式：重置表單
      formData.patientId = '';
      formData.drugOrTreatmentName = '';
      formData.description = '';
      formData.dosage = '';
      formData.usageMethod = '';
      formData.totalUsage = 1;
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
