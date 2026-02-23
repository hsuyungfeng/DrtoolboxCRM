<template>
  <div class="schedule-view">
    <div class="page-header">
      <h1>療程排程</h1>
      <n-space>
        <n-radio-group v-model:value="viewMode" name="viewMode">
          <n-radio-button value="month">月曆</n-radio-button>
          <n-radio-button value="week">週曆</n-radio-button>
        </n-radio-group>
        <n-button @click="goToToday">今天</n-button>
        <n-tag v-if="draggedSession" type="info">
          拖曳中: {{ draggedSession.patientName }}
        </n-tag>
      </n-space>
    </div>

    <n-card>
      <n-calendar
        v-model:value="currentDate"
        #="{ year, month, date }"
        :is-date-disabled="isDateDisabled"
        @update:value="handleDateClick"
      >
        <div class="calendar-cell">
          <div class="date-number">{{ date }}</div>
          <div 
            class="session-list"
            @dragover.prevent
            @drop="handleDrop($event, year, month, date)"
          >
            <div
              v-for="session in getSessionsForDate(year, month, date)"
              :key="session.id"
              class="session-item"
              :class="[getSessionClass(session), { 'dragging': draggedSession?.id === session.id }]"
              draggable="true"
              @dragstart="handleDragStart($event, session)"
              @dragend="handleDragEnd"
              @click.stop="viewSessionDetail(session)"
            >
              <span class="session-time">{{ formatSessionTime(session) }}</span>
              <span class="session-title">{{ session.patientName || '未安排' }}</span>
            </div>
          </div>
        </div>
      </n-calendar>
    </n-card>

    <n-card title="待處理排程" style="margin-top: 16px">
      <n-data-table
        :columns="pendingColumns"
        :data="pendingSessions"
        :pagination="pagination"
        :row-key="(row) => row.id"
      />
    </n-card>

    <n-modal
      v-model:show="showSessionModal"
      preset="dialog"
      :title="modalTitle"
      style="width: 600px"
    >
      <n-form v-if="selectedSession" label-placement="left" label-width="100px">
        <n-form-item label="患者">
          <n-input :value="selectedSession.patientName" disabled />
        </n-form-item>
        <n-form-item label="療程">
          <n-input :value="selectedSession.treatmentName" disabled />
        </n-form-item>
        <n-form-item label="排程日期">
          <n-input :value="formatDate(selectedSession.scheduledDate)" disabled />
        </n-form-item>
        <n-form-item label="排程時間">
          <n-input :value="formatTime(selectedSession.scheduledTime)" disabled />
        </n-form-item>
        <n-form-item label="狀態">
          <n-tag :type="getStatusType(selectedSession.status)">
            {{ getStatusText(selectedSession.status) }}
          </n-tag>
        </n-form-item>
        <n-form-item label="執行人員">
          <n-input :value="selectedSession.executedBy || '未指派'" disabled />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button @click="showSessionModal = false">關閉</n-button>
          <n-button type="primary" @click="markSessionStarted" :disabled="selectedSession?.status !== 'scheduled'">
            開始執行
          </n-button>
          <n-button type="success" @click="markSessionCompleted" :disabled="selectedSession?.status !== 'in_progress'">
            完成療程
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import {
  NCard, NButton, NSpace, NRadioGroup, NRadioButton, NCalendar,
  NDataTable, NTag, NModal, NForm, NFormItem, NInput, useMessage,
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { TreatmentSession } from '@/types';
import { treatmentSessionApi } from '../services/treatments-api';

const viewMode = ref<'month' | 'week'>('month');
const currentDate = ref(Date.now());
const sessions = ref<TreatmentSession[]>([]);
const showSessionModal = ref(false);
const selectedSession = ref<TreatmentSession | null>(null);
const draggedSession = ref<TreatmentSession | null>(null);

const pendingSessions = computed(() => {
  return sessions.value.filter(s => s.status === 'scheduled');
});

const modalTitle = computed(() => {
  return selectedSession.value ? '療程會話詳情' : '排程詳情';
});

const pagination = {
  pageSize: 10,
};

function handleDragStart(event: DragEvent, session: TreatmentSession) {
  draggedSession.value = session;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', session.id);
  }
}

function handleDragEnd() {
  draggedSession.value = null;
}

async function handleDrop(event: DragEvent, year: number, month: number, date: number) {
  event.preventDefault();
  
  if (!draggedSession.value) return;
  
  const newDate = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  const message = useMessage();
  
  try {
    await treatmentSessionApi.update(draggedSession.value.id, {
      scheduledDate: newDate,
    } as any);
    
    message.success(`已將排程移動至 ${newDate}`);
    await loadSessions();
  } catch (error) {
    message.error('更新排程失敗');
    console.error('Failed to update schedule:', error);
  }
  
  draggedSession.value = null;
}

const isDateDisabled = (_timestamp: number) => {
  return false;
};

function getSessionsForDate(year: number, month: number, date: number): TreatmentSession[] {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  return sessions.value.filter(s => {
    if (!s.scheduledDate) return false;
    const sessionDate = new Date(s.scheduledDate).toISOString().split('T')[0];
    return sessionDate === dateStr;
  });
}

function formatSessionTime(session: TreatmentSession): string {
  if (!session.scheduledTime) return '';
  const time = new Date(session.scheduledTime);
  return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
}

function formatTime(date: Date | string | undefined): string {
  if (!date) return '-';
  const time = new Date(date);
  return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
}

function getSessionClass(session: TreatmentSession): string {
  const classes: Record<string, string> = {
    scheduled: 'session-scheduled',
    in_progress: 'session-in-progress',
    completed: 'session-completed',
    cancelled: 'session-cancelled',
  };
  return classes[session.status] || 'session-scheduled';
}

function getStatusType(status: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const types: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error',
  };
  return types[status] || 'default';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    scheduled: '待執行',
    in_progress: '執行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return texts[status] || status;
}

function handleDateClick(timestamp: number) {
  console.log('Selected date:', new Date(timestamp));
}

function viewSessionDetail(session: TreatmentSession) {
  selectedSession.value = session;
  showSessionModal.value = true;
}

async function markSessionStarted() {
  if (!selectedSession.value) return;
  try {
    await treatmentSessionApi.update(selectedSession.value.id, {
      status: 'in_progress',
      actualStartTime: new Date().toISOString(),
    });
    await loadSessions();
    showSessionModal.value = false;
  } catch (error) {
    console.error('更新失敗:', error);
  }
}

async function markSessionCompleted() {
  if (!selectedSession.value) return;
  try {
    await treatmentSessionApi.update(selectedSession.value.id, {
      status: 'completed',
      completionStatus: 'completed',
      actualEndTime: new Date().toISOString(),
    });
    await loadSessions();
    showSessionModal.value = false;
  } catch (error) {
    console.error('更新失敗:', error);
  }
}

function goToToday() {
  currentDate.value = Date.now();
}

async function loadSessions() {
  try {
    const clinicId = 'clinic_001';
    sessions.value = await treatmentSessionApi.getAll(clinicId);
  } catch (error) {
    console.error('加載排程失敗:', error);
    sessions.value = [];
  }
}

const pendingColumns: DataTableColumns<TreatmentSession> = [
  {
    title: '日期',
    key: 'scheduledDate',
    render(row) {
      return row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '-';
    },
  },
  {
    title: '時間',
    key: 'scheduledTime',
    render(row) {
      return row.scheduledTime ? formatTime(row.scheduledTime) : '-';
    },
  },
  {
    title: '患者',
    key: 'patientName',
    render(row) {
      return row.patientName || '未安排';
    },
  },
  {
    title: '療程',
    key: 'treatmentName',
  },
  {
    title: '狀態',
    key: 'status',
    render(row) {
      return h(NTag, { type: getStatusType(row.status) }, { default: () => getStatusText(row.status) });
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NButton, { size: 'small', onClick: () => viewSessionDetail(row) }, { default: () => '查看' });
    },
  },
];

onMounted(async () => {
  await loadSessions();
});
</script>

<style scoped>
.schedule-view {
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

.calendar-cell {
  height: 100%;
  padding: 4px;
}

.date-number {
  font-weight: bold;
  margin-bottom: 4px;
}

.session-item {
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 0.2s, box-shadow 0.2s;
}

.session-item:hover {
  opacity: 0.8;
}

.session-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 20px;
}

.session-list:empty::before {
  content: '可拖曳至此';
  color: #ccc;
  font-size: 10px;
  padding: 4px;
}

.session-scheduled {
  background-color: #e6f4ff;
  border-left: 3px solid #1890ff;
}

.session-in-progress {
  background-color: #fff7e6;
  border-left: 3px solid #faad14;
}

.session-completed {
  background-color: #f6ffed;
  border-left: 3px solid #52c41a;
}

.session-cancelled {
  background-color: #fff1f0;
  border-left: 3px solid #ff4d4f;
}

.session-time {
  font-weight: bold;
  margin-right: 4px;
}
</style>
