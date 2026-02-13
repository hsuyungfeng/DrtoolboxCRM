<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NButton,
  NTag,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NSpin,
  useMessage,
} from 'naive-ui';
import type { TreatmentCourse, TreatmentCourseSession } from '@/types';
import treatmentCoursesApi from '@/services/treatments-api';
import SessionEditModal from './SessionEditModal.vue';

interface Props {
  courseId: string;
  clinicId: string;
  courseData?: TreatmentCourse;
}

const props = defineProps<Props>();
const message = useMessage();

const loading = ref(false);
const courseSessions = ref<TreatmentCourseSession[]>([]);
const editingSession = ref<TreatmentCourseSession | null>(null);
const showEditModal = ref(false);

// 療程階段
const TREATMENT_STAGES = [
  { key: 'basic', name: '基礎治療', sessions: [1, 2, 3] },
  { key: 'advanced', name: '進階治療', sessions: [4, 5, 6, 7] },
  { key: 'maintenance', name: '維護', sessions: [8, 9, 10] },
];

// 生命周期
onMounted(async () => {
  if (props.courseData?.sessions) {
    courseSessions.value = props.courseData.sessions;
  } else {
    await loadSessions();
  }
});

// 加載療程會話
async function loadSessions() {
  try {
    loading.value = true;
    const course = await treatmentCoursesApi.getCourse(props.courseId, props.clinicId);
    courseSessions.value = course.sessions || [];
  } catch (error) {
    console.error('加載療程會話失敗:', error);
    message.error('加載療程會話失敗');
  } finally {
    loading.value = false;
  }
}

// 根據階段篩選會話
function getSessionsForStage(stageNumbers: number[]): TreatmentCourseSession[] {
  return courseSessions.value.filter((s) =>
    stageNumbers.includes(s.sessionNumber || 0)
  );
}

// 取得會話狀態文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待執行',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}

// 取得會話狀態顏色
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'default' {
  const statusTypeMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'error',
  };
  return statusTypeMap[status] || 'default';
}

// 取得會話狀態圖示
function getStatusIcon(status: string): string {
  const statusIconMap: Record<string, string> = {
    pending: '⏳',
    completed: '✅',
    cancelled: '❌',
  };
  return statusIconMap[status] || '❓';
}


// 格式化日期
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-TW');
}

// 編輯會話
function editSession(session: TreatmentCourseSession) {
  editingSession.value = session;
  showEditModal.value = true;
}

// 保存會話更新
async function saveSessionUpdate(updatedSession: TreatmentCourseSession) {
  try {
    loading.value = true;
    await treatmentCoursesApi.updateSession(
      updatedSession.id,
      {
        scheduledDate: updatedSession.scheduledDate,
        actualStartTime: updatedSession.actualStartTime,
        actualEndTime: updatedSession.actualEndTime,
        completionStatus: updatedSession.completionStatus,
        therapistNotes: updatedSession.therapistNotes,
        patientFeedback: updatedSession.patientFeedback,
        staffAssignments: updatedSession.staffAssignments,
      },
      props.clinicId
    );
    message.success('會話更新成功');
    showEditModal.value = false;
    editingSession.value = null;
    await loadSessions();
  } catch (error) {
    console.error('更新會話失敗:', error);
    message.error('更新會話失敗');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="treatment-session-table">
    <n-spin :show="loading">
      <div v-if="courseSessions.length === 0" class="empty-state">
        <n-empty description="尚無會話資訊" />
      </div>

      <div v-else class="stages-container">
        <n-collapse>
          <n-collapse-item
            v-for="stage in TREATMENT_STAGES"
            :key="stage.key"
            :title="`${stage.name} (${getSessionsForStage(stage.sessions).length} 次)`"
            :name="stage.key"
          >
            <div class="stage-content">
              <table class="sessions-table">
                <thead>
                  <tr>
                    <th class="col-number">次數</th>
                    <th class="col-date">預定日期</th>
                    <th class="col-time">預定時間</th>
                    <th class="col-actual">實際時間</th>
                    <th class="col-status">狀態</th>
                    <th class="col-therapist">治療師</th>
                    <th class="col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="session in getSessionsForStage(stage.sessions)" :key="session.id">
                    <td class="col-number">
                      <strong>第 {{ session.sessionNumber }} 次</strong>
                    </td>
                    <td class="col-date">{{ formatDate(session.scheduledDate) }}</td>
                    <td class="col-time">
                      {{
                        session.scheduledTime
                          ? new Date(session.scheduledTime).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'
                      }}
                    </td>
                    <td class="col-actual">
                      <div v-if="session.actualStartTime || session.actualEndTime">
                        {{
                          session.actualStartTime
                            ? new Date(session.actualStartTime).toLocaleTimeString('zh-TW', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'
                        }}
                        -
                        {{
                          session.actualEndTime
                            ? new Date(session.actualEndTime).toLocaleTimeString('zh-TW', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'
                        }}
                      </div>
                      <div v-else>-</div>
                    </td>
                    <td class="col-status">
                      <n-tag :type="getStatusType(session.completionStatus)">
                        {{ getStatusIcon(session.completionStatus) }}
                        {{ getStatusText(session.completionStatus) }}
                      </n-tag>
                    </td>
                    <td class="col-therapist">
                      <div v-if="session.staffAssignments && session.staffAssignments.length > 0">
                        <div
                          v-for="staff in session.staffAssignments"
                          :key="staff.staffId"
                          class="staff-item"
                        >
                          <div>{{ staff.staffName || staff.staffId }}</div>
                          <div class="ppf-percentage">
                            PPF: {{ staff.ppfPercentage }}%
                          </div>
                        </div>
                      </div>
                      <div v-else>-</div>
                    </td>
                    <td class="col-actions">
                      <n-button
                        type="primary"
                        size="small"
                        @click="editSession(session)"
                      >
                        編輯
                      </n-button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- 會話編輯模態框 -->
      <SessionEditModal
        v-if="editingSession"
        v-model:show="showEditModal"
        :session="editingSession"
        :clinic-id="clinicId"
        @save="saveSessionUpdate"
        @close="editingSession = null"
      />
    </n-spin>
  </div>
</template>

<style scoped>
.treatment-session-table {
  width: 100%;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.stages-container {
  width: 100%;
}

.stage-content {
  padding: 16px 0;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e8e8e8;
}

.sessions-table thead {
  background: #f5f7fa;
  border-bottom: 2px solid #e8e8e8;
}

.sessions-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 13px;
}

.sessions-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;
}

.sessions-table tbody tr:hover {
  background: #f9fafb;
}

.col-number {
  width: 60px;
}

.col-date {
  width: 100px;
}

.col-time {
  width: 100px;
}

.col-actual {
  width: 120px;
}

.col-status {
  width: 90px;
}

.col-therapist {
  width: 150px;
}

.col-actions {
  width: 80px;
  text-align: center;
}

.staff-item {
  margin-bottom: 4px;
  font-size: 12px;
}

.ppf-percentage {
  color: #999;
  font-size: 11px;
  margin-top: 2px;
}
</style>
