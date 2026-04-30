<template>
  <div class="analytics-dashboard">
    <n-grid :cols="2" :x-gap="12" :y-gap="12">
      <n-gi>
        <n-card title="營收預測 (AI)">
          <n-skeleton v-if="loading" text :repeat="3" />
          <n-space v-else vertical size="large">
            <n-statistic label="下月預計營收" :value="forecastData?.forecastNextMonth">
              <template #prefix>$</template>
            </n-statistic>
            <n-statistic label="進行中療程剩餘價值" :value="forecastData?.potentialActiveRevenue">
              <template #prefix>$</template>
            </n-statistic>
            <n-text depth="3">基於過去三個月平均月營收 ${{ forecastData?.averageMonthlyRevenue.toFixed(0) }} 推算</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="患者屬性分析">
          <n-space vertical>
            <n-select
              v-model:value="selectedAttribute"
              :options="attributeOptions"
              placeholder="選擇分析維度"
              @update:value="loadDistribution"
            />
            <div ref="chartRef" style="height: 300px; width: 100%"></div>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { NCard, NGrid, NGi, NStatistic, NSpace, NText, NSelect, NSkeleton } from 'naive-ui';
import * as echarts from 'echarts';
import { analyticsApi, type RevenueForecast } from '@/services/analytics-api';

const loading = ref(true);
const forecastData = ref<RevenueForecast | null>(null);
const chartRef = ref<HTMLElement | null>(null);
const selectedAttribute = ref('skinType');
const attributeOptions = [
  { label: '皮膚類型', value: 'skinType' },
  { label: '諮詢目的', value: 'consultGoal' },
  { label: '推薦來源', value: 'referralSource' },
];

let chart: echarts.ECharts | null = null;

const loadDistribution = async () => {
  try {
    const { data } = await analyticsApi.getDistribution(selectedAttribute.value);
    if (chart) {
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            data: data.map(d => ({ value: d.count, name: d.value || '未填寫' })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      });
    }
  } catch (err) {
    console.error('分析失敗', err);
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await analyticsApi.getForecast();
    forecastData.value = data;
    
    // 初始化圖表
    if (chartRef.value) {
      chart = echarts.init(chartRef.value);
      loadDistribution();
    }
  } catch (err) {
    console.error('載入預測失敗', err);
  } finally {
    loading.value = false;
  }
});
</script>
