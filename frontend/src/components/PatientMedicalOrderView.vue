<!-- 患者醫令視圖 — 唯讀顯示患者自己的醫令列表與使用進度 -->
<template>
  <div class="patient-medical-order-view">
    <n-spin :show="loading">
      <n-empty
        v-if="orders.length === 0 && !loading"
        description="沒有醫令記錄"
      />

      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >
        <n-card size="small" :title="order.drugOrTreatmentName">
          <template #header-extra>
            <n-tag :type="getStatusType(order.status)">
              {{ getStatusLabel(order.status) }}
            </n-tag>
          </template>

          <n-grid cols="2" x-gap="12" y-gap="12">
            <n-gi>
              <span class="field-label">劑量：</span>
              {{ order.dosage }}
            </n-gi>
            <n-gi>
              <span class="field-label">使用方式：</span>
              {{ order.usageMethod }}
            </n-gi>
            <n-gi :span="2">
              <span class="field-label">使用進度：</span>
              <div class="progress-section">
                <span class="progress-text">
                  {{ order.usedCount ?? 0 }} / {{ order.totalUsage }} 次
                </span>
                <n-progress
                  :percentage="getUsagePercent(order)"
                  type="line"
                />
              </div>
            </n-gi>
          </n-grid>

          <template v-if="order.description">
            <n-divider style="margin: 12px 0" />
            <p class="description">{{ order.description }}</p>
          </template>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NCard,
  NGrid,
  NGi,
  NProgress,
  NTag,
  NSpin,
  NEmpty,
  NDivider,
} from 'naive-ui';
import { medicalOrdersApi } from '@/services/medical-orders-api';
import type { MedicalOrder } from '@/services/medical-orders-api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const orders = ref<MedicalOrder[]>([]);
const loading = ref(false);

/** 狀態標籤類型 */
const getStatusType = (
  status: string,
): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  const map: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
    pending: 'default',
    in_progress: 'info',
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
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] ?? status;
};

/** 計算使用進度百分比（0–100） */
const getUsagePercent = (order: MedicalOrder): number => {
  if (!order.totalUsage || order.totalUsage === 0) return 0;
  return Math.round(((order.usedCount ?? 0) / order.totalUsage) * 100);
};

/** 載入患者醫令 */
const loadOrders = async () => {
  loading.value = true;
  try {
    const patientId = userStore.user?.id;
    if (!patientId) return;
    const data = await medicalOrdersApi.getPatientOrders(patientId);
    orders.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('載入醫令失敗:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadOrders);
</script>

<style scoped>
.patient-medical-order-view {
  padding: 8px 0;
}

.order-card {
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

.description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>
