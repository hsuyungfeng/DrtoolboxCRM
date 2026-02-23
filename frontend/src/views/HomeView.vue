<template>
  <div class="home-view">
    <h1>Doctor CRM 儀表板</h1>
    <p>歡迎使用醫療診所客戶關係管理系統</p>
    
    <div class="quick-stats">
      <n-statistic label="今日療程" :value="todaySessions">
        <template #suffix>次</template>
      </n-statistic>
      <n-statistic label="本月分潤" :value="monthlyRevenue">
        <template #prefix>¥</template>
      </n-statistic>
      <n-statistic label="活躍患者" :value="activePatients">
        <template #suffix>人</template>
      </n-statistic>
      <n-statistic label="員工數" :value="staffCount">
        <template #suffix>人</template>
      </n-statistic>
    </div>

    <div class="dashboard-charts">
      <n-card title="本月療程趨勢" class="chart-card">
        <div ref="revenueChartRef" style="width: 100%; height: 300px;"></div>
      </n-card>
      
      <n-card title="分潤類型分佈" class="chart-card">
        <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
      </n-card>
    </div>

    <div class="dashboard-charts">
      <n-card title="各角色分潤統計" class="chart-card">
        <div ref="roleChartRef" style="width: 100%; height: 300px;"></div>
      </n-card>
      
      <n-card title="療程完成進度" class="chart-card">
        <div ref="progressChartRef" style="width: 100%; height: 300px;"></div>
      </n-card>
    </div>

    <div class="dashboard-cards">
      <n-card title="患者管理" hoverable>
        <template #header-extra>
          <n-icon size="24">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </n-icon>
        </template>
        <p>管理患者醫療檔案與聯繫信息</p>
        <n-button type="primary" @click="$router.push('/patients')">
          進入患者管理
        </n-button>
      </n-card>

      <n-card title="療程管理" hoverable>
        <template #header-extra>
          <n-icon size="24">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.53c0-2.5 3.97-3.58 6-3.58s6 1.08 6 3.58V19z"/>
            </svg>
          </n-icon>
        </template>
        <p>追蹤療程執行進度與狀態</p>
        <n-button type="primary" @click="$router.push('/treatments')">
          進入療程管理
        </n-button>
      </n-card>

      <n-card title="排程管理" hoverable>
        <template #header-extra>
          <n-icon size="24">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
            </svg>
          </n-icon>
        </template>
        <p>查看與管理療程排程</p>
        <n-button type="primary" @click="$router.push('/schedule')">
          進入排程管理
        </n-button>
      </n-card>

      <n-card title="分潤管理" hoverable>
        <template #header-extra>
          <n-icon size="24">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c0 1.82-1.34 2.98-3.13 3.29z"/>
            </svg>
          </n-icon>
        </template>
        <p>計算與管理療程分潤</p>
        <n-button type="primary" @click="$router.push('/revenue')">
          進入分潤管理
        </n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { NCard, NButton, NIcon, NStatistic } from 'naive-ui';
import * as echarts from 'echarts';

const revenueChartRef = ref<HTMLElement | null>(null);
const pieChartRef = ref<HTMLElement | null>(null);
const roleChartRef = ref<HTMLElement | null>(null);
const progressChartRef = ref<HTMLElement | null>(null);

const todaySessions = ref(8);
const monthlyRevenue = ref(152300);
const activePatients = ref(45);
const staffCount = ref(12);

let revenueChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;
let roleChart: echarts.ECharts | null = null;
let progressChart: echarts.ECharts | null = null;

function initCharts() {
  if (revenueChartRef.value) {
    revenueChart = echarts.init(revenueChartRef.value);
    revenueChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      },
      yAxis: { type: 'value', name: '金額 (¥)' },
      series: [
        {
          name: '療程營收',
          type: 'bar',
          data: [82000, 93200, 90100, 134000, 129000, 152300, 145000, 168000, 182000, 195000, 210000, 235000],
          itemStyle: { color: '#5470c6' },
        },
        {
          name: '分潤支出',
          type: 'line',
          data: [25000, 28000, 27000, 42000, 38000, 48000, 45000, 52000, 58000, 62000, 68000, 75000],
          itemStyle: { color: '#91cc75' },
        },
      ],
    });
  }

  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '分潤類型',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 45000, name: '百分比分潤' },
            { value: 25000, name: '固定金額' },
            { value: 15000, name: '階梯式分潤' },
            { value: 8000, name: '其他' },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    });
  }

  if (roleChartRef.value) {
    roleChart = echarts.init(roleChartRef.value);
    roleChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['醫生', '治療師', '助理', '顧問'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
      series: [
        {
          name: '醫生',
          type: 'bar',
          stack: 'total',
          label: { show: true, position: 'insideRight' },
          data: [12000, 14000, 11000, 15000, 16000, 18000],
        },
        {
          name: '治療師',
          type: 'bar',
          stack: 'total',
          label: { show: true, position: 'insideRight' },
          data: [8000, 9000, 8500, 10000, 11000, 12000],
        },
        {
          name: '助理',
          type: 'bar',
          stack: 'total',
          label: { show: true, position: 'insideRight' },
          data: [3000, 3500, 3200, 4000, 4200, 4500],
        },
        {
          name: '顧問',
          type: 'bar',
          stack: 'total',
          label: { show: true, position: 'insideRight' },
          data: [2000, 2500, 2100, 3000, 2800, 3500],
        },
      ],
    });
  }

  if (progressChartRef.value) {
    progressChart = echarts.init(progressChartRef.value);
    progressChart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '療程進度',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)',
          },
          data: [
            { value: 1048, name: '已完成' },
            { value: 300, name: '執行中' },
            { value: 280, name: '待執行' },
            { value: 120, name: '已取消' },
          ],
        },
      ],
    });
  }
}

function handleResize() {
  revenueChart?.resize();
  pieChart?.resize();
  roleChart?.resize();
  progressChart?.resize();
}

onMounted(() => {
  initCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  revenueChart?.dispose();
  pieChart?.dispose();
  roleChart?.dispose();
  progressChart?.dispose();
});
</script>

<style scoped>
.home-view {
  padding: 24px;
}

h1 {
  margin-bottom: 12px;
  color: #333;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin: 32px 0;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
}

.dashboard-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  min-height: 360px;
}
</style>
