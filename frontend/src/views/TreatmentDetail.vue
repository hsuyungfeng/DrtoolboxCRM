<template>
  <div class="treatment-detail">
    <n-message-provider>
      <!-- 載入中狀態 -->
      <div v-if="loading" class="loading-wrapper">
        <n-spin size="large" />
      </div>

      <!-- 療程詳情 -->
      <n-card v-else-if="treatment">
        <template #header>
          <div class="detail-header">
            <n-button text @click="$router.back()">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
            <h1>{{ treatment.name }}</h1>
          </div>
        </template>

        <!-- 基本資訊 -->
        <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen">
          <n-gi>
            <n-statistic label="患者">
              {{ treatment.patient?.name ?? treatment.patientName ?? '-' }}
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="類型">
              {{ typeLabel(treatment.type) }}
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="狀態">
              <n-tag :type="statusType(treatment.status)">
                {{ statusLabel(treatment.status) }}
              </n-tag>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="每堂費用">
              NT${{ treatment.costPerSession ?? '-' }}
            </n-statistic>
          </n-gi>
        </n-grid>

        <!-- 進度條 -->
        <div class="progress-section">
          <h3>療程進度</h3>
          <TreatmentProgressBar
            :completed="completedSessions"
            :total="totalSessions"
          />
        </div>

        <n-divider />

        <!-- 課程列表 -->
        <h3>課程列表</h3>
        <n-list v-if="sessions.length > 0" bordered>
          <n-list-item v-for="session in sessions" :key="session.id">
            <div class="session-row">
              <n-checkbox
                :checked="session.completionStatus === 'completed'"
                :disabled="session.completionStatus === 'completed'"
                @update:checked="handleSessionToggle(session.id, $event)"
              >
                課程 {{ session.sequenceNumber ?? session.sessionNumber ?? session.sessionIndex }}
              </n-checkbox>
              <div class="session-meta">
                <span v-if="session.staffAssignments?.length" class="staff-names">
                  {{ session.staffAssignments.map((s: StaffAssignment) => s.staffName ?? s.staffId).join('、') }}
                </span>
                <n-tag
                  size="small"
                  :type="sessionTagType(session.completionStatus ?? session.status)"
                >
                  {{ sessionStatusLabel(session.completionStatus ?? session.status) }}
                </n-tag>
              </div>
            </div>
          </n-list-item>
        </n-list>
        <n-empty v-else description="尚無課程記錄" />

        <!-- 說明 -->
        <template v-if="treatment.description">
          <n-divider />
          <h3>說明</h3>
          <p class="description">{{ treatment.description }}</p>
        </template>
      </n-card>

      <!-- 查無資料 -->
      <n-result v-else status="404" title="療程不存在" description="找不到指定的療程資料">
        <template #footer>
          <n-button @click="$router.back()">返回</n-button>
        </template>
      </n-result>
    </n-message-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NCard,
  NGrid,
  NGi,
  NStatistic,
  NTag,
  NList,
  NListItem,
  NCheckbox,
  NDivider,
  NEmpty,
  NResult,
  NButton,
  NIcon,
  NSpin,
  NMessageProvider,
  useMessage,
} from 'naive-ui';
import { treatmentsApi } from '@/services/treatments-api';
import { useUserStore } from '@/stores/user';
import TreatmentProgressBar from '@/components/TreatmentProgressBar.vue';

/** 醫護分配資料型別 */
interface StaffAssignment {
  staffId: string;
  staffName?: string;
  staffRole?: string;
}

/** 課程資料型別 */
interface Session {
  id: string;
  sequenceNumber?: number;
  sessionNumber?: number;
  sessionIndex?: number;
  completionStatus?: string;
  status?: string;
  staffAssignments?: StaffAssignment[];
}

/** 療程詳情資料型別 */
interface TreatmentDetail {
  id: string;
  name: string;
  type?: string;
  status: string;
  costPerSession?: number;
  description?: string;
  patient?: { name?: string };
  patientName?: string;
  progress?: {
    completedSessions?: number;
    totalSessions?: number;
  };
  completedSessions?: number;
  totalSessions?: number;
  sessions?: Session[];
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const message = useMessage();

const loading = ref(false);
const treatment = ref<TreatmentDetail | null>(null);

/** 課程列表（從 treatment.sessions 取得） */
const sessions = computed<Session[]>(() => treatment.value?.sessions ?? []);

/** 已完成課程數 */
const completedSessions = computed(() => {
  if (treatment.value?.progress?.completedSessions !== undefined) {
    return treatment.value.progress.completedSessions;
  }
  if (treatment.value?.completedSessions !== undefined) {
    return treatment.value.completedSessions;
  }
  return sessions.value.filter((s) => s.completionStatus === 'completed').length;
});

/** 總課程數 */
const totalSessions = computed(() => {
  if (treatment.value?.progress?.totalSessions !== undefined) {
    return treatment.value.progress.totalSessions;
  }
  return treatment.value?.totalSessions ?? sessions.value.length;
});

/** 療程類型標籤 */
function typeLabel(type?: string): string {
  const map: Record<string, string> = {
    rehabilitation: '復健治療',
    cosmetic: '美容療程',
    dental: '牙科療程',
    other: '其他',
  };
  return type ? (map[type] ?? type) : '-';
}

/** 療程狀態標籤 */
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待開始',
    in_progress: '進行中',
    active: '進行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] ?? status;
}

/** 療程狀態標籤類型 */
function statusType(status: string): 'default' | 'info' | 'success' | 'error' | 'warning' {
  const map: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
    pending: 'default',
    in_progress: 'info',
    active: 'info',
    completed: 'success',
    cancelled: 'error',
  };
  return map[status] ?? 'default';
}

/** 課程狀態標籤 */
function sessionStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    pending: '待完成',
    completed: '已完成',
    cancelled: '已取消',
    scheduled: '已排程',
  };
  return status ? (map[status] ?? status) : '待完成';
}

/** 課程狀態標籤類型 */
function sessionTagType(status?: string): 'default' | 'info' | 'success' | 'error' {
  const map: Record<string, 'default' | 'info' | 'success' | 'error'> = {
    pending: 'default',
    scheduled: 'info',
    completed: 'success',
    cancelled: 'error',
  };
  return status ? (map[status] ?? 'default') : 'default';
}

/** 載入療程詳情 */
const loadTreatment = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const data = await treatmentsApi.getTreatment(id, {
      clinicId: userStore.clinicId || undefined,
    });
    treatment.value = data as unknown as TreatmentDetail;
  } catch (error) {
    console.error('載入療程失敗:', error);
    message.error('載入療程失敗');
  } finally {
    loading.value = false;
  }
};

/** 標記課程為完成 */
const handleSessionToggle = async (sessionId: string, checked: boolean) => {
  if (!checked) return; // 只支援標記為完成，不支援反向操作
  try {
    await treatmentsApi.completeSession(sessionId);
    message.success('課程已標記為完成');
    await loadTreatment();
  } catch (error) {
    console.error('更新課程狀態失敗:', error);
    message.error('更新課程失敗，請重試');
  }
};

onMounted(loadTreatment);
</script>

<style scoped>
.treatment-detail {
  padding: 24px;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-header h1 {
  margin: 0;
  color: #333;
}

.progress-section {
  margin-top: 24px;
}

.progress-section h3 {
  margin: 0 0 12px;
  color: #555;
}

h3 {
  margin: 16px 0 8px;
  color: #555;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.staff-names {
  font-size: 13px;
  color: #666;
}

.description {
  color: #555;
  line-height: 1.6;
}
</style>
