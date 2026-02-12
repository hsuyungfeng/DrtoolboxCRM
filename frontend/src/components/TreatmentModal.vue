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

interface FormData {
  patientId: string;
  name: string;
  suggestedPrice: number;
  totalPrice: number;
  totalSessions: number;
  expectedEndDate: number | null;
  enableReminder: boolean;
  notes: string;
}

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
  confirm: [data: FormData];
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

    const submitData: FormData = {
      patientId: formValue.value.patientId,
      name: formValue.value.name,
      suggestedPrice: formValue.value.suggestedPrice,
      totalPrice: formValue.value.totalPrice,
      totalSessions: formValue.value.totalSessions,
      expectedEndDate: formValue.value.expectedEndDate,
      enableReminder: formValue.value.enableReminder,
      notes: formValue.value.notes,
    };

    emit('confirm', submitData);
  } catch (error) {
    message.error('表單驗證失敗');
  }
}

loadPatients();
</script>
