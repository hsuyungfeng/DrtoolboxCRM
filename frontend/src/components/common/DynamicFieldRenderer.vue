<template>
  <div class="dynamic-field-renderer">
    <div v-for="def in definitions" :key="def.id" class="dynamic-field-item">
      <n-form-item :label="def.label" :path="getFieldPath(def.name)" :rule="getRule(def)">
        <!-- Text Type -->
        <n-input
          v-if="def.type === 'text'"
          v-model:value="modelValue[def.name]"
          :placeholder="`請輸入${def.label}`"
          @update:value="handleUpdate(def.name, $event)"
        />

        <!-- Number Type -->
        <n-input-number
          v-else-if="def.type === 'number'"
          v-model:value="modelValue[def.name]"
          :placeholder="`請輸入${def.label}`"
          style="width: 100%"
          @update:value="handleUpdate(def.name, $event)"
        />

        <!-- Select Type -->
        <n-select
          v-else-if="def.type === 'select'"
          v-model:value="modelValue[def.name]"
          :options="formatOptions(def.options)"
          :placeholder="`請選擇${def.label}`"
          clearable
          @update:value="handleUpdate(def.name, $event)"
        />

        <!-- Date Type -->
        <n-date-picker
          v-else-if="def.type === 'date'"
          v-model:formatted-value="modelValue[def.name]"
          value-format="yyyy-MM-dd"
          type="date"
          :placeholder="`請選擇${def.label}`"
          style="width: 100%"
          @update:formatted-value="handleUpdate(def.name, $event)"
        />

        <!-- Multi-select Type -->
        <n-select
          v-else-if="def.type === 'multiselect'"
          v-model:value="modelValue[def.name]"
          :options="formatOptions(def.options)"
          :placeholder="`請選擇${def.label}`"
          multiple
          clearable
          @update:value="handleUpdate(def.name, $event)"
        />

        <!-- Date Range Type -->
        <n-date-picker
          v-else-if="def.type === 'daterange'"
          v-model:formatted-value="modelValue[def.name]"
          value-format="yyyy-MM-dd"
          type="daterange"
          :placeholder="`請選擇${def.label}範圍`"
          style="width: 100%"
          @update:formatted-value="handleUpdate(def.name, $event)"
        />

        <!-- File Type (Basic URL/Reference) -->
        <div v-else-if="def.type === 'file'" style="width: 100%">
          <n-upload
            action="/api/upload"
            :default-file-list="getFileList(modelValue[def.name])"
            @finish="handleFileUpload(def.name, $event)"
            @remove="handleFileRemove(def.name)"
          >
            <n-button>上傳檔案</n-button>
          </n-upload>
          <div v-if="modelValue[def.name]" class="file-link">
             現有檔案: <a :href="modelValue[def.name]" target="_blank">查看檔案</a>
          </div>
        </div>
      </n-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NUpload,
  NButton,
} from 'naive-ui';

interface AttributeDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'file' | 'daterange';
  options: string[] | null;
  isRequired: boolean;
}

const props = defineProps<{
  definitions: AttributeDefinition[];
  modelValue: Record<string, any>;
  pathPrefix?: string; // Optional prefix for form path, e.g., 'customFields'
}>();

const emit = defineEmits(['update:modelValue']);

const handleUpdate = (name: string, value: any) => {
  const newValue = { ...props.modelValue, [name]: value };
  emit('update:modelValue', newValue);
};

const handleFileUpload = (name: string, { file }: any) => {
  // Assume the API returns the file URL
  const fileUrl = file.url || file.response?.url;
  if (fileUrl) {
    handleUpdate(name, fileUrl);
  }
};

const handleFileRemove = (name: string) => {
  handleUpdate(name, null);
};

const getFileList = (url: string | null) => {
  if (!url) return [];
  return [{ id: '1', name: '檔案', status: 'finished', url }];
};

const formatOptions = (options: string[] | null) => {
  if (!options) return [];
  return options.map(opt => ({ label: opt, value: opt }));
};

const getFieldPath = (name: string) => {
  return props.pathPrefix ? `${props.pathPrefix}.${name}` : name;
};

const getRule = (def: AttributeDefinition) => {
  if (!def.isRequired) return undefined;
  
  return {
    required: true,
    message: `${def.label}是必填項`,
    trigger: ['select', 'multiselect', 'date', 'daterange'].includes(def.type) ? 'change' : 'blur',
  };
};
</script>

<style scoped>
.dynamic-field-renderer {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.dynamic-field-item {
  width: 100%;
}

.file-link {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

@media (min-width: 768px) {
  /* You can make it 2 columns if needed */
  /* .dynamic-field-renderer {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  } */
}
</style>
