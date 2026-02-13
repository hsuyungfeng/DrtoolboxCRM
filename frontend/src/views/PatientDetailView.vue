<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NCard,
  NTabs,
  NTabPane,
  NButton,
  NSpace,
  NIcon,
  NSpin,
  NMessageProvider,
  useMessage,
} from 'naive-ui';
import type { Patient } from '@/types';
import { patientsApi } from '@/services/api';
import { useUserStore } from '@/stores/user';
import TreatmentHistoryTab from '@/components/patients/TreatmentHistoryTab.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const message = useMessage();

const patientId = computed(() => route.params.id as string);
const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const loading = ref(false);
const patient = ref<Patient | null>(null);
const activeTab = ref('info');

// 生命周期
onMounted(async () => {
  await loadPatient();
});

// 加載患者資訊
async function loadPatient() {
  try {
    loading.value = true;
    patient.value = await patientsApi.getById(patientId.value, clinicId.value);
  } catch (error) {
    console.error('加載患者資訊失敗:', error);
    message.error('加載患者資訊失敗');
    router.back();
  } finally {
    loading.value = false;
  }
}

// 返回患者列表
function goBack() {
  router.back();
}
</script>

<template>
  <n-message-provider>
    <div class="patient-detail-view">
      <div class="page-header">
        <n-button text @click="goBack" type="primary">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </n-icon>
          </template>
          返回
        </n-button>
      </div>

      <n-spin :show="loading">
        <div v-if="patient" class="patient-details">
          <!-- 患者基本資訊卡片 -->
          <n-card class="patient-info-card">
            <div class="patient-header">
              <div class="patient-name">{{ patient.name }}</div>
              <n-space>
                <div class="info-item">
                  <span class="label">身份證號:</span>
                  <span class="value">{{ patient.idNumber || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">性別:</span>
                  <span class="value">
                    {{
                      { male: '男', female: '女', other: '其他' }[patient.gender || 'other']
                    }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">生日:</span>
                  <span class="value">
                    {{
                      patient.dateOfBirth
                        ? new Date(patient.dateOfBirth).toLocaleDateString('zh-TW')
                        : '-'
                    }}
                  </span>
                </div>
              </n-space>
            </div>
            <div class="patient-contact">
              <div class="info-item">
                <span class="label">電話:</span>
                <span class="value">{{ patient.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">郵箱:</span>
                <span class="value">{{ patient.email || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">緊急聯絡人:</span>
                <span class="value">{{ patient.emergencyContactName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">緊急聯絡電話:</span>
                <span class="value">{{ patient.emergencyContactPhone || '-' }}</span>
              </div>
            </div>
          </n-card>

          <!-- 選項卡 -->
          <n-tabs v-model:value="activeTab" type="line" class="patient-tabs">
            <n-tab-pane name="info" tab="基本資訊">
              <div class="tab-content">
                <n-card>
                  <div class="info-section">
                    <h3>過敏史</h3>
                    <p>{{ patient.allergyHistory || '無' }}</p>
                  </div>
                  <div class="info-section">
                    <h3>用藥記錄</h3>
                    <p>{{ patient.medicationRecord || '無' }}</p>
                  </div>
                  <div class="info-section">
                    <h3>醫療備註</h3>
                    <p>{{ patient.medicalNotes || '無' }}</p>
                  </div>
                </n-card>
              </div>
            </n-tab-pane>

            <n-tab-pane name="treatment" tab="治療歷史">
              <TreatmentHistoryTab :patient-id="patientId" :clinic-id="clinicId" />
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-spin>
    </div>
  </n-message-provider>
</template>

<style scoped>
.patient-detail-view {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.patient-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.patient-info-card {
  margin-bottom: 24px;
}

.patient-header {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.patient-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.patient-contact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.label {
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.value {
  color: #333;
}

.patient-tabs {
  margin-top: 24px;
}

.tab-content {
  padding: 24px 0;
}

.info-section {
  margin-bottom: 24px;
}

.info-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.info-section p {
  color: #666;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
