<template>
  <n-card title="療程次數管理（1-10次）" :segmented="{ content: true }">
    <n-space vertical size="large">
      <!-- 療程次數表格 -->
      <div v-if="sessions.length > 0">
        <n-table :columns="columns" :data="sessions" :bordered="false" :single-line="false" />
      </div>
      <div v-else style="text-align: center; padding: 20px; color: #999;">
        尚未添加任何療程次數記錄
      </div>

      <!-- 記錄療程次數表單 -->
      <div class="session-form">
        <h4>記錄療程次數</h4>
        <n-form :model="newSession" label-placement="left" :label-width="100">
          <n-form-item label="次數">
            <n-select
              v-model:value="newSession.sessionNumber"
              :options="availableSessionNumbers"
              placeholder="選擇次數"
              clearable
            />
          </n-form-item>

          <n-form-item label="預定時間">
            <n-date-picker
              v-model:value="newSession.scheduledTime"
              type="datetime"
              placeholder="選擇預定時間"
              clearable
            />
          </n-form-item>

          <n-form-item label="執行人員">
            <n-select
              v-model:value="newSession.executedBy"
              :options="staffOptions"
              placeholder="選擇執行人員"
              clearable
            />
          </n-form-item>

          <n-form-item label="完成狀態">
            <n-radio-group v-model:value="newSession.status">
              <n-radio value="scheduled">未完成</n-radio>
              <n-radio value="completed">已完成</n-radio>
            </n-radio-group>
          </n-form-item>

          <n-form-item v-if="newSession.status === 'completed'" label="實際完成時間">
            <n-date-picker
              v-model:value="newSession.actualEndTime"
              type="datetime"
              placeholder="選擇完成時間"
              clearable
            />
          </n-form-item>

          <n-form-item label="備註">
            <n-input
              v-model:value="newSession.notes"
              type="textarea"
              placeholder="療程記錄備註"
              :rows="3"
            />
          </n-form-item>

          <n-space>
            <n-button type="primary" @click="addSession">新增次數記錄</n-button>
            <n-button @click="resetForm">清除</n-button>
          </n-space>
        </n-form>
      </div>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NCard,
  NSpace,
  NTable,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NRadioGroup,
  NRadio,
  NButton,
  NInput,
  useMessage,
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

// 療程次數記錄介面
interface SessionRecord {
  sessionNumber: number | null;
  scheduledTime: number | null;
  actualStartTime: number | null;
  actualEndTime: number | null;
  executedBy: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

// 組件屬性
interface Props {
  totalSessions: number;
  clinicId: string;
}

const props = defineProps<Props>();
const message = useMessage();

// 響應式狀態
const sessions = ref<SessionRecord[]>([]);

const newSession = ref<SessionRecord>({
  sessionNumber: null,
  scheduledTime: null,
  actualStartTime: null,
  actualEndTime: null,
  executedBy: null,
  status: 'scheduled',
  notes: '',
});

// 執行人員選項（實際應從 API 獲取）
const staffOptions = ref([
  { label: '醫生 A', value: 'staff-1' },
  { label: '護理師 B', value: 'staff-2' },
  { label: '美容師 C', value: 'staff-3' },
]);

// 計算可用的療程次數
const availableSessionNumbers = computed(() => {
  const used = new Set(sessions.value.map((s) => s.sessionNumber));
  const available = [];
  for (let i = 1; i <= props.totalSessions; i++) {
    if (!used.has(i)) {
      available.push({ label: `第 ${i} 次`, value: i });
    }
  }
  return available;
});

// 表格列定義
const columns: DataTableColumns<SessionRecord> = [
  {
    title: '次數',
    key: 'sessionNumber',
    width: 80,
  },
  {
    title: '預定時間',
    key: 'scheduledTime',
    width: 150,
    render: (row) => formatDate(row.scheduledTime),
  },
  {
    title: '完成時間',
    key: 'actualEndTime',
    width: 150,
    render: (row) => formatDate(row.actualEndTime) || '-',
  },
  {
    title: '執行人員',
    key: 'executedBy',
    width: 120,
    render: (row) => getStaffName(row.executedBy),
  },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    render: (row) => getStatusLabel(row.status),
  },
  {
    title: '備註',
    key: 'notes',
    width: 200,
  },
];

// 添加療程次數記錄
const addSession = () => {
  if (!newSession.value.sessionNumber) {
    message.warning('請選擇次數');
    return;
  }

  if (sessions.value.length >= props.totalSessions) {
    message.warning(`最多只能添加 ${props.totalSessions} 次記錄`);
    return;
  }

  sessions.value.push({ ...newSession.value });
  message.success('次數記錄已添加');
  resetForm();
};

// 清空表單
const resetForm = () => {
  newSession.value = {
    sessionNumber: null,
    scheduledTime: null,
    actualStartTime: null,
    actualEndTime: null,
    executedBy: null,
    status: 'scheduled',
    notes: '',
  };
};

// 格式化日期時間
const formatDate = (timestamp: number | null) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-TW');
};

// 獲取執行人員名稱
const getStaffName = (staffId: string | null) => {
  if (!staffId) return '-';
  const staff = staffOptions.value.find((s) => s.value === staffId);
  return staff ? staff.label : staffId;
};

// 獲取狀態標籤
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    scheduled: '未完成',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
};
</script>

<style scoped>
.session-form {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 16px;
}

h4 {
  margin: 0 0 16px 0;
  color: #333;
}
</style>
