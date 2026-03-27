<template>
  <div class="medical-order-detail">
    <!-- 載入中狀態 -->
    <div v-if="loading" class="loading-wrapper">
      <n-spin size="large" />
    </div>

    <!-- 醫令詳情 -->
    <n-card v-else-if="order">
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
          <h1>{{ order.drugOrTreatmentName }}</h1>
        </div>
      </template>

      <!-- 基本資訊 -->
      <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen">
        <n-gi>
          <n-statistic label="患者">
            {{ order.patientName ?? order.patientId ?? '-' }}
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="狀態">
            <n-tag :type="getStatusType(order.status)">
              {{ getStatusLabel(order.status) }}
            </n-tag>
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="劑量">
            {{ order.dosage ?? '-' }}
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="使用方式">
            {{ order.usageMethod ?? '-' }}
          </n-statistic>
        </n-gi>
        <n-gi v-if="order.description" :span="2">
          <n-statistic label="說明">
            {{ order.description }}
          </n-statistic>
        </n-gi>
      </n-grid>

      <n-divider />

      <!-- 使用進度 -->
      <div class="progress-section">
        <h3>使用進度</h3>
        <div class="progress-info">
          <span>{{ order.usedCount ?? 0 }} / {{ order.totalUsage }} 已使用</span>
          <span class="percentage">{{ getProgressPercent(order) }}%</span>
        </div>
        <n-progress
          :percentage="getProgressPercent(order)"
          type="line"
          :color="progressColor(order.status)"
          :indicator-placement="'inside'"
        />
      </div>

      <n-divider />

      <!-- 操作按鈕 -->
      <div class="actions">
        <n-space>
          <!-- 開始使用（pending → in_progress） -->
          <n-button
            v-if="order.status === 'pending'"
            type="primary"
            @click="handleStatusChange('in_progress')"
          >
            開始使用
          </n-button>

          <!-- 記錄使用次數（in_progress） -->
          <n-button
            v-if="order.status === 'in_progress'"
            type="primary"
            @click="showRecordDialog = true"
          >
            記錄使用
          </n-button>

          <!-- 取消醫令 -->
          <n-button
            v-if="['pending', 'in_progress'].includes(order.status)"
            type="error"
            @click="handleCancelOrder"
          >
            取消醫令
          </n-button>
        </n-space>
      </div>
    </n-card>

    <!-- 查無資料 -->
    <n-result
      v-else
      status="404"
      title="醫令不存在"
      description="找不到指定的醫令資料"
    >
      <template #footer>
        <n-button @click="$router.back()">返回</n-button>
      </template>
    </n-result>

    <!-- 記錄使用對話框 -->
    <n-modal
      v-model:show="showRecordDialog"
      title="記錄使用次數"
      preset="dialog"
      :mask-closable="false"
    >
      <n-form label-placement="top">
        <n-form-item label="本次使用次數">
          <n-input-number
            v-model:value="recordData.usedCount"
            :min="1"
            :max="order ? (order.totalUsage - (order.usedCount ?? 0)) : 1"
            :precision="0"
            style="width: 100%"
          />
        </n-form-item>
        <n-text depth="3" style="font-size: 13px">
          剩餘可用次數：{{ order ? (order.totalUsage - (order.usedCount ?? 0)) : 0 }}
        </n-text>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button @click="showRecordDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleRecordUsage">確認記錄</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NCard,
  NGrid,
  NGi,
  NStatistic,
  NTag,
  NDivider,
  NProgress,
  NButton,
  NIcon,
  NSpin,
  NResult,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NText,
  useMessage,
} from 'naive-ui';
import { medicalOrdersApi } from '@/services/medical-orders-api';
import type { MedicalOrder } from '@/services/medical-orders-api';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const loading = ref(false);
const submitting = ref(false);
const order = ref<MedicalOrder | null>(null);
const showRecordDialog = ref(false);
const recordData = ref({ usedCount: 1 });

/** 載入醫令詳情 */
const loadOrder = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const data = await medicalOrdersApi.getOrder(id);
    order.value = data as unknown as MedicalOrder;
  } catch (error) {
    console.error('載入醫令失敗:', error);
    message.error('載入醫令失敗');
    order.value = null;
  } finally {
    loading.value = false;
  }
};

/** 狀態標籤類型 */
const getStatusType = (status: string): 'default' | 'info' | 'success' | 'error' => {
  const types: Record<string, 'default' | 'info' | 'success' | 'error'> = {
    pending: 'default',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
  };
  return types[status] ?? 'default';
};

/** 狀態中文標籤 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待開始',
    in_progress: '進行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status] ?? status;
};

/** 計算使用進度百分比 */
const getProgressPercent = (o: MedicalOrder): number => {
  if (!o.totalUsage || o.totalUsage === 0) return 0;
  return Math.round(((o.usedCount ?? 0) / o.totalUsage) * 100);
};

/** 進度條顏色 */
const progressColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#d0d0d0',
    in_progress: '#18a058',
    completed: '#18a058',
    cancelled: '#d03050',
  };
  return colors[status] ?? '#18a058';
};

/** 更新醫令狀態 */
const handleStatusChange = async (newStatus: 'in_progress' | 'completed') => {
  if (!order.value) return;
  try {
    await medicalOrdersApi.updateOrder(order.value.id, { status: newStatus });
    message.success('狀態已更新');
    await loadOrder();
  } catch (error) {
    console.error('更新狀態失敗:', error);
    message.error('更新失敗，請稍後重試');
  }
};

/** 記錄使用次數 */
const handleRecordUsage = async () => {
  if (!order.value) return;
  submitting.value = true;
  try {
    await medicalOrdersApi.recordUsage(order.value.id, recordData.value.usedCount);
    message.success('使用進度已記錄');
    showRecordDialog.value = false;
    recordData.value.usedCount = 1;
    await loadOrder();
  } catch (error) {
    console.error('記錄失敗:', error);
    message.error('記錄失敗，請稍後重試');
  } finally {
    submitting.value = false;
  }
};

/** 取消醫令 */
const handleCancelOrder = async () => {
  if (!order.value) return;
  try {
    await medicalOrdersApi.cancelOrder(order.value.id);
    message.success('醫令已取消');
    await loadOrder();
  } catch (error) {
    console.error('取消失敗:', error);
    message.error('取消失敗，請稍後重試');
  }
};

onMounted(loadOrder);
</script>

<style scoped>
.medical-order-detail {
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
  margin-top: 8px;
}

.progress-section h3 {
  margin: 0 0 12px;
  color: #555;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.percentage {
  font-weight: 600;
  color: #333;
}

.actions {
  margin-top: 8px;
}

h3 {
  margin: 16px 0 8px;
  color: #555;
}
</style>
