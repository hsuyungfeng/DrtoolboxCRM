<template>
  <div class="home-view">
    <h1>Doctor CRM 首頁</h1>
    <p>歡迎使用醫療診所客戶關係管理系統</p>
    
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

      <n-card title="員工管理" hoverable>
        <template #header-extra>
          <n-icon size="24">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </n-icon>
        </template>
        <p>管理員工信息與專業角色</p>
        <n-button type="primary" @click="$router.push('/staff')">
          進入員工管理
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NButton, NIcon, NStatistic } from 'naive-ui';

// 模擬數據
const todaySessions = ref(8);
const monthlyRevenue = ref(152300);
const activePatients = ref(45);
const staffCount = ref(12);
</script>

<style scoped>
.home-view {
  padding: 24px;
}

h1 {
  margin-bottom: 12px;
  color: #333;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>