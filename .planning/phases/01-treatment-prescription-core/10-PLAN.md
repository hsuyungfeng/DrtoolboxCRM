---
phase: 01-treatment-prescription-core
plan: 10
type: execute
wave: 3
depends_on: [03, 06]
files_modified:
  - frontend/src/views/PatientDashboard.vue
  - frontend/src/components/PatientTreatmentView.vue
  - frontend/src/components/PatientMedicalOrderView.vue
autonomous: true
requirements: [COURSE-05, PATIENT-03]
must_haves:
  truths:
    - 患者能查看自己的療程列表與進度
    - 患者能查看已開立的醫令
    - 患者可以搜尋和篩選
  artifacts:
    - path: frontend/src/views/PatientDashboard.vue
      provides: 患者儀表板頁面
      contains: "<template>"

---

<objective>
建立患者面向的儀表板，顯示患者自己的療程、醫令和進度。

**Purpose:**
患者需要查看自己的治療進度和醫令資訊。

**Output:**
PatientDashboard、PatientTreatmentView、PatientMedicalOrderView 組件。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 患者視圖

患者只能看到自己的資料，不能編輯或刪除。
只能看到已關聯的療程和醫令。

## API 端點

- GET /api/patients/me - 取得當前患者資訊
- GET /api/patients/me/treatments - 患者療程列表
- GET /api/patients/me/medical-orders - 患者醫令列表
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 PatientDashboard 和相關組件</name>
  <files>
    - frontend/src/views/PatientDashboard.vue
    - frontend/src/components/PatientTreatmentView.vue
    - frontend/src/components/PatientMedicalOrderView.vue
  </files>

  <read_first>
    - frontend/src/views/TreatmentList.vue
    - frontend/src/views/MedicalOrderList.vue
  </read_first>

  <action>
建立患者儀表板組件：

**PatientDashboard.vue**

```vue
<template>
  <div class="patient-dashboard">
    <n-card>
      <h1>我的療程與醫令</h1>

      <n-tabs>
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
import PatientTreatmentView from '@/components/PatientTreatmentView.vue';
import PatientMedicalOrderView from '@/components/PatientMedicalOrderView.vue';
</script>
```

**PatientTreatmentView.vue**

```vue
<template>
  <div class="patient-treatment-view">
    <n-empty
      v-if="treatments.length === 0 && !loading"
      description="沒有療程"
    />

    <n-spin :show="loading">
      <div v-for="treatment in treatments" :key="treatment.id" class="treatment-card">
        <n-card size="small" :title="treatment.name">
          <n-grid cols="2" x-gap="12" y-gap="12">
            <n-gi><strong>類型：</strong> {{ treatment.type }}</n-gi>
            <n-gi>
              <strong>費用：</strong> NT${{ treatment.costPerSession }}/堂
            </n-gi>
            <n-gi colspan="2">
              <strong>進度：</strong>
              <div class="progress-section">
                <span>{{ treatment.progress.completedSessions }} / {{ treatment.progress.totalSessions }}</span>
                <n-progress
                  :percentage="treatment.progress.progressPercent"
                  type="line"
                  color="#4CAF50"
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
import { treatmentsApi } from '@/services/treatments-api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const treatments = ref([]);
const loading = ref(false);

const loadTreatments = async () => {
  loading.value = true;
  try {
    const response = await treatmentsApi.getPatientTreatments(
      userStore.user.id
    );
    treatments.value = response.data;
  } catch (error) {
    console.error('載入療程失敗');
  } finally {
    loading.value = false;
  }
};

onMounted(loadTreatments);
</script>

<style scoped>
.treatment-card {
  margin-bottom: 16px;
}

.progress-section {
  margin-top: 8px;
}
</style>
```

**PatientMedicalOrderView.vue**

```vue
<template>
  <div class="patient-medical-order-view">
    <n-empty
      v-if="orders.length === 0 && !loading"
      description="沒有醫令"
    />

    <n-spin :show="loading">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <n-card size="small" :title="order.藥物或治療名稱">
          <template #header-extra>
            <n-tag :type="getStatusType(order.status)">
              {{ getStatusLabel(order.status) }}
            </n-tag>
          </template>

          <n-grid cols="2" x-gap="12" y-gap="12">
            <n-gi><strong>劑量：</strong> {{ order.劑量 }}</n-gi>
            <n-gi><strong>使用方式：</strong> {{ order.使用方式 }}</n-gi>
            <n-gi colspan="2">
              <strong>進度：</strong>
              <div class="progress-section">
                <span>{{ order.已使用數 }} / {{ order.療程數 }}</span>
                <n-progress
                  :percentage="Math.round((order.已使用數 / order.療程數) * 100)"
                  type="line"
                />
              </div>
            </n-gi>
          </n-grid>

          <n-divider />

          <p v-if="order.說明" class="description">{{ order.說明 }}</p>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { medicalOrdersApi } from '@/services/medical-orders-api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const orders = ref([]);
const loading = ref(false);

const loadOrders = async () => {
  loading.value = true;
  try {
    const response = await medicalOrdersApi.getPatientOrders(
      userStore.user.id
    );
    orders.value = response.data;
  } catch (error) {
    console.error('載入醫令失敗');
  } finally {
    loading.value = false;
  }
};

const getStatusType = (status) => {
  const types = {
    pending: 'default',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
  };
  return types[status] || 'default';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: '待開始',
    in_progress: '進行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status] || status;
};

onMounted(loadOrders);
</script>

<style scoped>
.order-card {
  margin-bottom: 16px;
}

.progress-section {
  margin-top: 8px;
}

.description {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
</style>
```

設計：
- PatientDashboard：患者儀表板，標籤頁展示療程和醫令
- PatientTreatmentView：患者療程卡片，顯示進度
- PatientMedicalOrderView：患者醫令卡片，顯示狀態和使用進度
- 讀取 useUserStore 以取得當前患者 ID
  </action>

  <verify>
    - [ ] PatientDashboard.vue 存在：test -f frontend/src/views/PatientDashboard.vue
    - [ ] PatientTreatmentView.vue 存在：test -f frontend/src/components/PatientTreatmentView.vue
    - [ ] PatientMedicalOrderView.vue 存在：test -f frontend/src/components/PatientMedicalOrderView.vue
    - [ ] 包含進度條：grep -q "n-progress" frontend/src/components/PatientTreatmentView.vue
  </verify>

  <done>
- PatientDashboard 組件完成
- PatientTreatmentView 組件完成
- PatientMedicalOrderView 組件完成
  </done>
</task>

</tasks>

<verification>
**患者視圖驗證：**
- 患者能看到自己的療程列表
- 患者能看到自己的醫令列表
- 進度條正確顯示
- 狀態標籤正確

**資料隔離驗證：**
- 患者只能看到自己的資料
- 無法編輯或刪除
</verification>

<success_criteria>
- [ ] PatientDashboard 組件完成
- [ ] PatientTreatmentView 和 PatientMedicalOrderView 完成
- [ ] 進度視覺化工作
- [ ] 資料隔離確保
- [ ] 標籤頁切換正常
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/10-SUMMARY.md`
</output>

