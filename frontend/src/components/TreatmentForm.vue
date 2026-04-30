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

    <!-- 療程範本選擇 -->
    <n-form-item label="療程範本" path="templateId">
      <n-select
        v-model:value="formData.templateId"
        :options="treatmentTemplateOptions"
        filterable
        clearable
        :loading="loadingTemplates"
        placeholder="請選擇療程範本..."
        @update:value="handleTemplateSelect"
      />
    </n-form-item>

    <!-- 顯示選定範本的資訊（只讀） -->
    <n-alert
      v-if="selectedTemplate"
      type="info"
      closable
      style="margin-bottom: 16px"
    >
      <div class="template-info">
        <div><strong>療程名稱：</strong> {{ selectedTemplate.name }}</div>
        <div><strong>預設課程數：</strong> {{ selectedTemplate.defaultSessions }} 堂</div>
        <div><strong>預設價格：</strong> NT$ {{ selectedTemplate.defaultPrice }}</div>
        <div v-if="selectedTemplate.description" class="mt-8">
          <strong>說明：</strong> {{ selectedTemplate.description }}
        </div>
      </div>
    </n-alert>

    <!-- 可選：點數抵扣 -->
    <n-form-item label="積分抵扣（選填）" path="pointsToRedeem">
      <n-input-number
        v-model:value="formData.pointsToRedeem"
        :min="0"
        :precision="2"
        placeholder="請輸入要抵扣的積分數..."
        style="width: 100%"
      >
        <template #prefix>點</template>
      </n-input-number>
    </n-form-item>

    <!-- 操作按鈕 -->
    <div class="form-actions">
      <n-space justify="end">
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="primary" :loading="saving" :disabled="!formData.templateId" @click="handleSave">購買療程</n-button>
      </n-space>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue';
import {
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NButton,
  NSpace,
  NAlert,
} from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import { patientsApi } from '@/services/api';
import { treatmentCoursesApi } from '@/services/treatments-api';
import { useUserStore } from '@/stores/user';

/** 治療範本型別 */
interface TreatmentTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  defaultSessions: number;
}

/** 療程表單資料型別（對應後端 CreateTreatmentCourseDto） */
interface TreatmentFormData {
  patientId: string;
  templateId?: string;
  clinicId?: string;
  pointsToRedeem?: number;
}

const props = defineProps<{
  treatment?: any | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: TreatmentFormData): void;
  (e: 'cancel'): void;
}>();

const userStore = useUserStore();
const formRef = ref<FormInst | null>(null);
const saving = ref(false);
const searchingPatients = ref(false);
const patientOptions = ref<SelectOption[]>([]);
const loadingTemplates = ref(false);
const treatmentTemplateOptions = ref<SelectOption[]>([]);
const allTemplates = ref<TreatmentTemplate[]>([]);

const formData = reactive<TreatmentFormData>({
  patientId: '',
  templateId: undefined,
  clinicId: userStore.clinicId || 'clinic_001',
  pointsToRedeem: undefined,
});

/** 根據選定的 templateId 取得對應的範本詳情 */
const selectedTemplate = computed(() => {
  if (!formData.templateId) return null;
  return allTemplates.value.find(t => t.id === formData.templateId) || null;
});

/** 載入治療範本清單 */
const loadTreatmentTemplates = async () => {
  const clinicId = userStore.clinicId || 'clinic_001';
  loadingTemplates.value = true;
  try {
    const templates = await treatmentCoursesApi.getTemplates(clinicId);
    const list = Array.isArray(templates) ? templates : [];
    allTemplates.value = list as TreatmentTemplate[];
    treatmentTemplateOptions.value = list.map((t: TreatmentTemplate) => ({
      label: `${t.name} (${t.defaultSessions} 堂 × NT$${t.defaultPrice})`,
      value: t.id,
    }));
  } catch (error) {
    console.error('載入治療範本失敗:', error);
  } finally {
    loadingTemplates.value = false;
  }
};

/** 表單驗證規則 */
const rules: FormRules = {
  patientId: [{ required: true, message: '請選擇患者', trigger: 'change' }],
  templateId: [{ required: true, message: '請選擇療程範本', trigger: 'change' }],
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

/** 處理範本選擇變更 */
const handleTemplateSelect = (templateId: string | null) => {
  if (!templateId) {
    formData.templateId = undefined;
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

/** 重置表單 */
const resetForm = () => {
  formData.patientId = '';
  formData.templateId = undefined;
  formData.pointsToRedeem = undefined;
};

/** 元件掛載時載入治療範本 */
onMounted(() => {
  loadTreatmentTemplates();
});
</script>

<style scoped>
.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-info div {
  line-height: 1.6;
}

.mt-8 {
  margin-top: 8px;
}
</style>
