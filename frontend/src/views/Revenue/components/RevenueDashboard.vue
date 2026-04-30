<template>
  <div class="report-section">
    <!-- 日期範圍選擇器 -->
    <n-card style="margin-bottom: 16px">
      <n-space align="center">
        <span>日期範圍：</span>
        <n-date-picker
          v-model:value="reportDateRange"
          type="daterange"
          clearable
          :shortcuts="dateShortcuts"
          style="width: 280px"
          @update:value="handleDateRangeChange"
        />
        <n-button type="primary" @click="refreshReportData" :loading="revenueStore.loading">
          重新整理
        </n-button>
      </n-space>
    </n-card>

    <!-- 統計卡片行 -->
    <n-grid :cols="3" :x-gap="16" style="margin-bottom: 16px">
      <n-gi>
        <n-card>
          <n-statistic label="本期總收入（元）" :value="revenueStore.summary?.totalRevenue ?? 0">
            <template #prefix>$</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-statistic label="付款筆數" :value="revenueStore.summary?.paymentCount ?? 0" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-statistic label="平均單筆金額（元）" :value="revenueStore.averagePaymentAmount">
            <template #prefix>$</template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 圖表區域 -->
    <n-grid :cols="2" :x-gap="16" style="margin-bottom: 16px">
      <n-gi>
        <n-card title="月收入趨勢（近 12 個月）">
          <v-chart
            :option="revenueStore.monthlyTrendChartOption"
            autoresize
            style="height: 300px"
          />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="支付方式分布">
          <v-chart
            :option="revenueStore.paymentMethodChartOption"
            autoresize
            style="height: 280px"
          />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 醫護人員分潤明細表 -->
    <n-card title="醫護人員分潤統計">
      <n-data-table
        :columns="staffRevenueColumns"
        :data="revenueStore.staffRevenue"
        :loading="revenueStore.loading"
        :pagination="{ pageSize: 10 }"
        :row-key="(row) => row.staffId + row.role"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import {
  NCard, NSpace, NDatePicker, NButton, NGrid, NGi, NStatistic, NDataTable
} from 'naive-ui';
import { useRevenueStore } from '@/stores/revenue.store';
import { useRevenue } from '@/composables/useRevenue';

// ECharts 元件
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const revenueStore = useRevenueStore();
const { 
  reportDateRange, 
  dateShortcuts, 
  staffRevenueColumns,
  handleDateRangeChange, 
  refreshReportData 
} = useRevenue();
</script>

<style scoped>
.report-section {
  padding: 8px;
}
</style>
