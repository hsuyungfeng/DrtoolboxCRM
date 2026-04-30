<template>
  <div class="revenue-view">
    <div class="page-header">
      <h1>分潤管理</h1>
      <n-space>
        <n-button type="primary" @click="showCreateRuleModal = true">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
          </template>
          新增規則
        </n-button>
        <n-button secondary>
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
              </svg>
            </n-icon>
          </template>
          導出報表
        </n-button>
      </n-space>
    </div>

    <n-card>
      <n-tabs type="line" animated @update:value="onTabChange">
        <n-tab-pane name="records" tab="分潤記錄">
          <RevenueRecordsTable />
        </n-tab-pane>
        
        <n-tab-pane name="rules" tab="分潤規則">
          <RevenueRulesTable />
        </n-tab-pane>
        
        <n-tab-pane name="adjustments" tab="分潤調整">
          <RevenueAdjustmentTable />
        </n-tab-pane>
        
        <n-tab-pane name="calculator" tab="分潤試算">
          <div class="calculator-section">
            <n-card title="即時分潤試算" subtitle="輸入療程金額，即時查看各角色分潤分配">
              <n-space vertical :size="16">
                <n-form-item label="療程類型" path="treatmentType">
                  <n-select
                    v-model:value="calculatorForm.treatmentType"
                    :options="treatmentTypeOptions"
                    placeholder="請選擇療程類型"
                    style="width: 300px"
                  />
                </n-form-item>
                <n-form-item label="療程金額" path="amount">
                  <n-input-number
                    v-model:value="calculatorForm.amount"
                    :min="0"
                    :step="100"
                    placeholder="請輸入療程金額"
                    style="width: 300px"
                  >
                    <template #prefix>¥</template>
                  </n-input-number>
                </n-form-item>
                <n-button type="primary" @click="calculatePPF" :disabled="!calculatorForm.amount">
                  開始試算
                </n-button>
              </n-space>
            </n-card>

            <n-card v-if="calculationResult.length > 0" title="試算結果" style="margin-top: 16px">
              <n-data-table
                :columns="previewColumns"
                :data="calculationResult"
                :pagination="false"
              />
              <div class="total-summary">
                <n-statistic label="總分潤金額" :value="totalCalculatedAmount">
                  <template #prefix>¥</template>
                </n-statistic>
                <n-statistic label="分潤率" :value="totalPercentage" suffix="%">
                </n-statistic>
              </div>
            </n-card>

            <n-card v-if="tieredPreview.length > 0" title="階梯式規則預覽" style="margin-top: 16px">
              <n-data-table
                :columns="tieredColumns"
                :data="tieredPreview"
                :pagination="false"
              />
            </n-card>
          </div>
        </n-tab-pane>
        
        <n-tab-pane name="reports" tab="收入報表">
          <RevenueDashboard />
        </n-tab-pane>

        <n-tab-pane name="reconciliation" tab="對帳報告">
          <ReconciliationReportTable />
        </n-tab-pane>

        <n-tab-pane name="analytics" tab="營收預測">
          <RevenueForecastDashboard />
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import {
  NButton, NSpace, NIcon, NCard, NTabs, NTabPane, NFormItem, 
  NSelect, NInputNumber, NDataTable, NStatistic
} from 'naive-ui';
import { useRevenue } from '@/composables/useRevenue';

// 導入組件
import RevenueDashboard from './Revenue/components/RevenueDashboard.vue';
import RevenueRecordsTable from './Revenue/components/RevenueRecordsTable.vue';
import RevenueRulesTable from './Revenue/components/RevenueRulesTable.vue';
import RevenueAdjustmentTable from './Revenue/components/RevenueAdjustmentTable.vue';
import ReconciliationReportTable from './Revenue/components/ReconciliationReportTable.vue';
import RevenueForecastDashboard from './Revenue/components/RevenueForecastDashboard.vue';

const {
  showCreateRuleModal,
  calculatorForm,
  treatmentTypeOptions,
  calculationResult,
  previewColumns,
  totalCalculatedAmount,
  totalPercentage,
  tieredPreview,
  tieredColumns,
  loadRevenueData,
  calculatePPF,
  onTabChange
} = useRevenue();

// 初始化加載數據
onMounted(async () => {
  await loadRevenueData();
});
</script>

<style scoped>
.revenue-view {
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

.calculator-section {
  padding: 8px;
}

.total-summary {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
}
</style>
