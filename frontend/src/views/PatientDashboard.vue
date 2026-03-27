<!-- 患者儀表板 — 以標籤頁展示患者自己的療程與醫令 -->
<template>
  <div class="patient-dashboard">
    <n-card>
      <template #header>
        <h1 class="dashboard-title">我的療程與醫令</h1>
      </template>

      <n-tabs type="line" animated>
        <n-tab-pane name="treatments" tab="療程">
          <PatientTreatmentView />
        </n-tab-pane>
        <n-tab-pane name="orders" tab="醫令">
          <PatientMedicalOrderView />
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NTabs, NTabPane } from 'naive-ui';
import PatientTreatmentView from '@/components/PatientTreatmentView.vue';
import PatientMedicalOrderView from '@/components/PatientMedicalOrderView.vue';
</script>

<style scoped>
.patient-dashboard {
  padding: 24px;
}

.dashboard-title {
  margin: 0;
  font-size: 20px;
  color: #333;
}
</style>
