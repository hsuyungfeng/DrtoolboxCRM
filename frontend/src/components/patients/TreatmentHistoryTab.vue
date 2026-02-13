<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NButton,
  NSpace,
  NCard,
  NSpin,
  NProgress,
  NEmpty,
  NIcon,
  useMessage,
} from 'naive-ui';
import type { TreatmentCourse, TreatmentTemplate } from '@/types';
import treatmentCoursesApi from '@/services/treatments-api';
import TreatmentSessionTable from './TreatmentSessionTable.vue';
import { getCourseStatusText, getCourseStatusType, formatDate, formatCurrency } from '@/utils/formatters';

interface Props {
  patientId: string;
  clinicId: string;
}

const props = defineProps<Props>();
const message = useMessage();

const loading = ref(false);
const showCreateCourseModal = ref(false);
const courses = ref<TreatmentCourse[]>([]);
const templates = ref<TreatmentTemplate[]>([]);
const selectedCourseId = ref<string | null>(null);
const selectedTemplate = ref<TreatmentTemplate | null>(null);

// 計算療程進度百分比
function getProgressPercentage(course: TreatmentCourse): number {
  if (!course.sessions || course.sessions.length === 0) {
    return 0;
  }
  const completed = course.sessions.filter((s) => s.completionStatus === 'completed').length;
  return Math.round((completed / course.sessions.length) * 100);
}

// 計算已完成的會話數
function getCompletedCount(course: TreatmentCourse): number {
  if (!course.sessions) return 0;
  return course.sessions.filter((s) => s.completionStatus === 'completed').length;
}

// 生命周期
onMounted(async () => {
  await loadCourses();
  await loadTemplates();
});

// 加載患者的療程套餐
async function loadCourses() {
  try {
    loading.value = true;
    // 通過患者 ID 和診所 ID 取得所有療程套餐
    const response = await treatmentCoursesApi.getPatientCourses(props.patientId, props.clinicId);
    courses.value = response;
  } catch (error) {
    console.error('加載療程套餐失敗:', error);
    message.error('加載療程套餐失敗');
  } finally {
    loading.value = false;
  }
}

// 加載可用的療程模板
async function loadTemplates() {
  try {
    const response = await treatmentCoursesApi.getTemplates(props.clinicId);
    templates.value = response;
  } catch (error) {
    console.error('加載療程模板失敗:', error);
    message.error('加載療程模板失敗');
  }
}

// 建立新療程
async function createCourse() {
  if (!selectedTemplate.value) {
    message.warning('請選擇一個療程模板');
    return;
  }

  try {
    loading.value = true;
    await treatmentCoursesApi.createCourse({
      patientId: props.patientId,
      templateId: selectedTemplate.value.id,
      clinicId: props.clinicId,
    });
    message.success('療程套餐建立成功');
    showCreateCourseModal.value = false;
    selectedTemplate.value = null;
    await loadCourses();
  } catch (error) {
    console.error('建立療程套餐失敗:', error);
    message.error('建立療程套餐失敗');
  } finally {
    loading.value = false;
  }
}

// 查看療程詳細資訊
function viewCourseDetails(courseId: string) {
  selectedCourseId.value = courseId;
}

// 關閉詳細資訊檢視
function closeCourseDetails() {
  selectedCourseId.value = null;
}
</script>

<template>
  <div class="treatment-history-tab">
      <!-- 頂部操作欄 -->
      <div class="tab-header">
        <n-space>
          <n-button type="primary" @click="showCreateCourseModal = true">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </n-icon>
            </template>
            新增療程
          </n-button>
          <n-button secondary @click="loadCourses">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
                </svg>
              </n-icon>
            </template>
            重新整理
          </n-button>
        </n-space>
      </div>

      <!-- 療程列表 -->
      <n-spin :show="loading">
        <div class="courses-container">
          <n-empty
            v-if="courses.length === 0"
            description="尚無療程套餐"
            class="empty-state"
          />

          <div v-else class="courses-grid">
            <n-card
              v-for="course in courses"
              :key="course.id"
              class="course-card"
              :bordered="true"
              hoverable
            >
              <!-- 療程卡片內容 -->
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <div class="course-name">{{ course.templateName || '未知療程' }}</div>
                    <n-tag
                      :type="getCourseStatusType(course.status)"
                      size="small"
                      round
                      style="margin-left: 8px"
                    >
                      {{ getCourseStatusText(course.status) }}
                    </n-tag>
                  </div>
                </div>
              </template>

              <!-- 進度條 -->
              <div class="progress-section">
                <div class="progress-label">
                  完成進度:
                  <span class="progress-count">
                    {{ getCompletedCount(course) }}/{{ course.sessions?.length || 0 }}
                  </span>
                </div>
                <n-progress
                  :percentage="getProgressPercentage(course)"
                  type="line"
                  :status="
                    getProgressPercentage(course) === 100 ? 'success' : 'warning'
                  "
                />
              </div>

              <!-- 療程資訊 -->
              <div class="course-info">
                <div class="info-row">
                  <span class="label">購買日期:</span>
                  <span class="value">{{ formatDate(course.purchaseDate) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">購買金額:</span>
                  <span class="value">{{ formatCurrency(course.purchaseAmount) }}</span>
                </div>
                <div v-if="course.pointsRedeemed && Number(course.pointsRedeemed) > 0" class="info-row">
                  <span class="label">已兌換點數:</span>
                  <span class="value">{{ course.pointsRedeemed }}</span>
                </div>
              </div>

              <!-- 查看詳細按鈕 -->
              <template #footer>
                <n-space justify="end">
                  <n-button
                    type="primary"
                    size="small"
                    @click="viewCourseDetails(course.id)"
                  >
                    查看詳情
                  </n-button>
                </n-space>
              </template>
            </n-card>
          </div>

          <!-- 療程詳細資訊檢視 -->
          <div
            v-if="selectedCourseId"
            class="course-details-view"
          >
            <div class="details-header">
              <h2>療程詳情</h2>
              <n-button text @click="closeCourseDetails">
                <template #icon>
                  <n-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
            <div class="details-content">
              <TreatmentSessionTable
                v-for="course in courses.filter(c => c.id === selectedCourseId)"
                :key="course.id"
                :course-id="course.id"
                :clinic-id="clinicId"
                :course-data="course"
              />
            </div>
          </div>
        </div>
      </n-spin>

      <!-- 建立療程模態框 -->
      <n-modal
        v-model:show="showCreateCourseModal"
        preset="dialog"
        title="新增療程套餐"
        positive-text="確認"
        negative-text="取消"
        @positive-click="createCourse"
        @negative-click="showCreateCourseModal = false"
      >
        <div class="create-course-form">
          <div class="form-group">
            <label class="form-label">選擇療程模板</label>
            <div v-if="templates.length === 0" class="empty-templates">
              尚無可用的療程模板
            </div>
            <div v-else class="template-list">
              <n-card
                v-for="template in templates"
                :key="template.id"
                :bordered="true"
                hoverable
                :class="{ selected: selectedTemplate?.id === template.id }"
                @click="selectedTemplate = template"
                class="template-card"
              >
                <div class="template-name">{{ template.name }}</div>
                <div class="template-info">
                  <span>{{ template.defaultSessions }} 次療程</span>
                  <span>${{ template.defaultPrice.toFixed(2) }}</span>
                </div>
              </n-card>
            </div>
          </div>
        </div>
      </n-modal>
    </div>
</template>

<style scoped>
.treatment-history-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.courses-container {
  min-height: 200px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.course-card {
  transition: all 0.3s ease;
}

.course-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.progress-section {
  margin: 16px 0;
}

.progress-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-count {
  font-weight: 600;
  color: #333;
}

.course-info {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 500;
}

.course-details-view {
  margin-top: 24px;
  padding: 24px;
  background: #f5f7fa;
  border-radius: 4px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.details-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.details-content {
  background: white;
  padding: 24px;
  border-radius: 4px;
}

.create-course-form {
  padding: 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.empty-templates {
  padding: 24px;
  text-align: center;
  color: #999;
  background: #f5f7fa;
  border-radius: 4px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.template-card:hover {
  border-color: #1890ff;
}

.template-card.selected {
  border-color: #1890ff;
  background: #f0f7ff;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.template-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}
</style>
