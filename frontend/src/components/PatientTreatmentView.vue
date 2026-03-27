<!-- 患者療程視圖 — 唯讀顯示患者自己的療程列表與進度 -->
<template>
  <div class="patient-treatment-view">
    <n-spin :show="loading">
      <n-empty
        v-if="treatments.length === 0 && !loading"
        description="沒有療程記錄"
      />

      <div
        v-for="treatment in treatments"
        :key="treatment.id"
        class="treatment-card"
      >
        <n-card size="small" :title="treatment.name">
          <template #header-extra>
            <n-tag :type="getStatusType(treatment.status)">
              {{ getStatusLabel(treatment.status) }}
            </n-tag>
          </template>

          <n-grid cols="2" x-gap="12" y-gap="12">
            <n-gi>
              <span class="field-label">類型：</span>
              {{ treatment.type || '-' }}
            </n-gi>
            <n-gi>
              <span class="field-label">費用：</span>
              NT${{ treatment.costPerSession ?? '-' }}/堂
            </n-gi>
            <n-gi :span="2">
              <span class="field-label">進度：</span>
              <div class="progress-section">
                <span class="progress-text">
                  {{ getCompleted(treatment) }} / {{ getTotal(treatment) }} 堂
                </span>
                <n-progress
                  :percentage="getProgressPercent(treatment)"
                  type="line"
                  color="#4CAF50"
                  :indicator-placement="'inside'"
                />
              </div>
            </n-gi>
          </n-grid>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NGrid, NGi, NProgress, NTag, NSpin, NEmpty } from 'naive-ui';
import { treatmentsApi } from '@/services/treatments-api';
import { useUserStore } from '@/stores/user';

/** 療程行資料型別（患者視圖所需欄位） */
interface PatientTreatment {
  id: string;
  name: string;
  type?: string;
  status: string;
  costPerSession?: number;
  totalSessions?: number;
  completedSessions?: number;
  progress?: {
    completedSessions?: number;
    totalSessions?: number;
    progressPercent?: number;
  };
}

const userStore = useUserStore();
const treatments = ref<PatientTreatment[]>([]);
const loading = ref(false);

/** 狀態標籤類型 */
const getStatusType = (
  status: string,
): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  const map: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
    pending: 'default',
    in_progress: 'info',
    active: 'info',
    completed: 'success',
    cancelled: 'error',
  };
  return map[status] ?? 'default';
};

/** 狀態中文標籤 */
const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待開始',
    in_progress: '進行中',
    active: '進行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] ?? status;
};

/** 取得已完成課程數 */
const getCompleted = (t: PatientTreatment): number =>
  t.progress?.completedSessions ?? t.completedSessions ?? 0;

/** 取得總課程數 */
const getTotal = (t: PatientTreatment): number =>
  t.progress?.totalSessions ?? t.totalSessions ?? 1;

/** 計算進度百分比（0–100） */
const getProgressPercent = (t: PatientTreatment): number => {
  if (t.progress?.progressPercent != null) return t.progress.progressPercent;
  const total = getTotal(t);
  if (total === 0) return 0;
  return Math.round((getCompleted(t) / total) * 100);
};

/** 載入患者療程 */
const loadTreatments = async () => {
  loading.value = true;
  try {
    const patientId = userStore.user?.id;
    if (!patientId) return;
    const data = await treatmentsApi.getTreatments({ patientId });
    treatments.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('載入療程失敗:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadTreatments);
</script>

<style scoped>
.patient-treatment-view {
  padding: 8px 0;
}

.treatment-card {
  margin-bottom: 16px;
}

.field-label {
  font-weight: 600;
  color: #555;
}

.progress-section {
  margin-top: 8px;
}

.progress-text {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #555;
}
</style>
