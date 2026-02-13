<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NTimePicker,
  NSelect,
  NButton,
  NAlert,
  NMessageProvider,
  useMessage,
  NInputNumber,
} from 'naive-ui';
import type { TreatmentCourseSession, Staff, StaffAssignment } from '@/types';
import { staffApi } from '@/services/api';

interface Props {
  show: boolean;
  session: TreatmentCourseSession;
  clinicId: string;
}

const emit = defineEmits<{
  'update:show': [value: boolean];
  save: [session: TreatmentCourseSession];
  close: [];
}>();

const props = defineProps<Props>();
const message = useMessage();

const loading = ref(false);
const staffList = ref<Staff[]>([]);
const ppfValidationError = ref<string | null>(null);

// 表單資料
const formData = ref({
  scheduledDate: null as number | null,
  scheduledTime: null as number | null,
  actualStartTime: null as number | null,
  actualEndTime: null as number | null,
  completionStatus: 'pending' as 'pending' | 'completed' | 'cancelled',
  therapistNotes: '',
  patientFeedback: '',
  staffAssignments: [] as StaffAssignment[],
});

// 新增員工分派表單
const newStaffAssignment = ref({
  staffId: '',
  staffName: '',
  staffRole: '',
  ppfPercentage: 0,
});

// 計算PPF百分比總和
const totalPpf = computed(() => {
  return formData.value.staffAssignments.reduce((sum, item) => sum + (item.ppfPercentage || 0), 0);
});

// 驗證PPF百分比
function validatePpf() {
  if (formData.value.staffAssignments.length === 0) {
    ppfValidationError.value = null;
    return true;
  }

  if (totalPpf.value !== 100) {
    ppfValidationError.value = `PPF百分比總和必須為100% (目前: ${totalPpf.value}%)`;
    return false;
  }

  ppfValidationError.value = null;
  return true;
}

// 狀態選項
const completionStatusOptions = [
  { label: '待執行', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

// 生命周期
onMounted(async () => {
  await loadStaff();
  initializeForm();
});

// 初始化表單
function initializeForm() {
  const session = props.session;

  formData.value = {
    scheduledDate: session.scheduledDate
      ? new Date(session.scheduledDate).getTime()
      : null,
    scheduledTime: session.scheduledTime
      ? new Date(session.scheduledTime).getTime()
      : null,
    actualStartTime: session.actualStartTime
      ? new Date(session.actualStartTime).getTime()
      : null,
    actualEndTime: session.actualEndTime
      ? new Date(session.actualEndTime).getTime()
      : null,
    completionStatus: session.completionStatus || 'pending',
    therapistNotes: session.therapistNotes || '',
    patientFeedback: session.patientFeedback || '',
    staffAssignments: [...(session.staffAssignments || [])],
  };

  newStaffAssignment.value = {
    staffId: '',
    staffName: '',
    staffRole: '',
    ppfPercentage: 0,
  };

  ppfValidationError.value = null;
}

// 加載員工列表
async function loadStaff() {
  try {
    staffList.value = await staffApi.getAll(props.clinicId);
  } catch (error) {
    console.error('加載員工列表失敗:', error);
    message.error('加載員工列表失敗');
  }
}

// 獲取員工選項
const staffOptions = computed(() => {
  return staffList.value.map((staff) => ({
    label: `${staff.name} (${staff.role})`,
    value: staff.id,
  }));
});

// 新增員工分派
function addStaffAssignment() {
  if (!newStaffAssignment.value.staffId) {
    message.warning('請選擇員工');
    return;
  }

  if (newStaffAssignment.value.ppfPercentage <= 0) {
    message.warning('PPF百分比必須大於0');
    return;
  }

  const selectedStaff = staffList.value.find(
    (s) => s.id === newStaffAssignment.value.staffId
  );

  if (selectedStaff) {
    formData.value.staffAssignments.push({
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      staffRole: selectedStaff.role,
      ppfPercentage: newStaffAssignment.value.ppfPercentage,
    });

    newStaffAssignment.value = {
      staffId: '',
      staffName: '',
      staffRole: '',
      ppfPercentage: 0,
    };
  }
}

// 移除員工分派
function removeStaffAssignment(index: number) {
  formData.value.staffAssignments.splice(index, 1);
}

// 更新員工分派的PPF百分比
function updateStaffPpf(index: number, newValue: number | null) {
  if (newValue !== null && formData.value.staffAssignments[index]) {
    formData.value.staffAssignments[index].ppfPercentage = newValue;
  }
}

// 保存會話
async function handleSave() {
  if (!validatePpf()) {
    return;
  }

  try {
    loading.value = true;

    const updatedSession: TreatmentCourseSession = {
      ...props.session,
      scheduledDate: formData.value.scheduledDate
        ? new Date(formData.value.scheduledDate).toISOString().split('T')[0]
        : props.session.scheduledDate,
      scheduledTime: formData.value.scheduledTime
        ? new Date(formData.value.scheduledTime).toISOString()
        : props.session.scheduledTime,
      actualStartTime: formData.value.actualStartTime
        ? new Date(formData.value.actualStartTime).toISOString()
        : props.session.actualStartTime,
      actualEndTime: formData.value.actualEndTime
        ? new Date(formData.value.actualEndTime).toISOString()
        : props.session.actualEndTime,
      completionStatus: formData.value.completionStatus,
      therapistNotes: formData.value.therapistNotes,
      patientFeedback: formData.value.patientFeedback,
      staffAssignments: formData.value.staffAssignments,
    };

    emit('save', updatedSession);
  } catch (error) {
    console.error('保存失敗:', error);
    message.error('保存失敗');
  } finally {
    loading.value = false;
  }
}

// 關閉模態框
function handleClose() {
  emit('update:show', false);
  emit('close');
}
</script>

<template>
  <n-message-provider>
    <n-modal
      :show="show"
      preset="dialog"
      title="編輯會話"
      size="large"
      :positive-text="loading ? '保存中...' : '保存'"
      negative-text="取消"
      :positive-button-props="{ loading }"
      @positive-click="handleSave"
      @negative-click="handleClose"
    >
      <n-form :model="formData" class="session-form">
        <!-- 基本資訊部分 -->
        <div class="form-section">
          <h3 class="section-title">基本資訊</h3>

          <n-form-item label="會話號碼" path="sessionNumber">
            <span>第 {{ session.sessionNumber }} 次</span>
          </n-form-item>

          <div class="form-row">
            <n-form-item label="預定日期" path="scheduledDate">
              <n-date-picker
                v-model:value="formData.scheduledDate"
                type="date"
                clearable
                placeholder="選擇日期"
              />
            </n-form-item>

            <n-form-item label="預定時間" path="scheduledTime">
              <n-time-picker
                v-model:value="formData.scheduledTime"
                clearable
                placeholder="選擇時間"
              />
            </n-form-item>
          </div>
        </div>

        <!-- 實際執行時間部分 -->
        <div class="form-section">
          <h3 class="section-title">實際執行時間</h3>

          <div class="form-row">
            <n-form-item label="開始時間" path="actualStartTime">
              <n-time-picker
                v-model:value="formData.actualStartTime"
                clearable
                placeholder="選擇開始時間"
              />
            </n-form-item>

            <n-form-item label="結束時間" path="actualEndTime">
              <n-time-picker
                v-model:value="formData.actualEndTime"
                clearable
                placeholder="選擇結束時間"
              />
            </n-form-item>
          </div>
        </div>

        <!-- 會話狀態部分 -->
        <div class="form-section">
          <h3 class="section-title">會話狀態</h3>

          <n-form-item label="完成狀態" path="completionStatus">
            <n-select
              v-model:value="formData.completionStatus"
              :options="completionStatusOptions"
              clearable
            />
          </n-form-item>
        </div>

        <!-- 備註部分 -->
        <div class="form-section">
          <h3 class="section-title">備註</h3>

          <n-form-item label="治療師備註" path="therapistNotes">
            <n-input
              v-model:value="formData.therapistNotes"
              type="textarea"
              placeholder="輸入治療師備註"
              :rows="3"
            />
          </n-form-item>

          <n-form-item label="患者反饋" path="patientFeedback">
            <n-input
              v-model:value="formData.patientFeedback"
              type="textarea"
              placeholder="輸入患者反饋"
              :rows="3"
            />
          </n-form-item>
        </div>

        <!-- 員工分派部分 -->
        <div class="form-section">
          <h3 class="section-title">員工分派與PPF分配</h3>

          <n-alert
            v-if="ppfValidationError"
            type="error"
            :title="ppfValidationError"
            class="ppf-alert"
          />

          <!-- 已分派的員工表 -->
          <div v-if="formData.staffAssignments.length > 0" class="staff-table-section">
            <div class="table-label">已分派的員工</div>
            <table class="staff-table">
              <thead>
                <tr>
                  <th>員工名稱</th>
                  <th>職位</th>
                  <th>PPF百分比 (%)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(staff, index) in formData.staffAssignments" :key="index">
                  <td>{{ staff.staffName }}</td>
                  <td>{{ staff.staffRole }}</td>
                  <td>
                    <n-input-number
                      :value="staff.ppfPercentage || 0"
                      min="0"
                      max="100"
                      @update:value="(val) => updateStaffPpf(index, val)"
                    />
                  </td>
                  <td>
                    <n-button
                      type="error"
                      size="small"
                      @click="removeStaffAssignment(index)"
                    >
                      移除
                    </n-button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="ppf-summary">
              PPF總和: <strong :class="totalPpf === 100 ? 'valid' : 'invalid'">
                {{ totalPpf }}%
              </strong>
            </div>
          </div>

          <!-- 新增員工分派 -->
          <div class="form-row">
            <n-form-item label="選擇員工" path="staffSelection">
              <n-select
                v-model:value="newStaffAssignment.staffId"
                :options="staffOptions"
                clearable
                placeholder="選擇員工"
              />
            </n-form-item>

            <n-form-item label="PPF百分比" path="ppfPercentage">
              <n-input-number
                v-model:value="newStaffAssignment.ppfPercentage"
                min="0"
                max="100"
                placeholder="輸入PPF百分比"
              />
            </n-form-item>

            <n-form-item>
              <n-button @click="addStaffAssignment">新增</n-button>
            </n-form-item>
          </div>
        </div>
      </n-form>
    </n-modal>
  </n-message-provider>
</template>

<style scoped>
.session-form {
  padding: 16px 0;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.ppf-alert {
  margin-bottom: 16px;
}

.staff-table-section {
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
}

.table-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.staff-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e8e8e8;
  margin-bottom: 8px;
}

.staff-table thead {
  background: #f5f7fa;
  border-bottom: 1px solid #e8e8e8;
}

.staff-table th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: #333;
}

.staff-table td {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.ppf-summary {
  font-size: 13px;
  color: #666;
  text-align: right;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
}

.ppf-summary strong {
  margin-left: 8px;
}

.ppf-summary strong.valid {
  color: #52c41a;
}

.ppf-summary strong.invalid {
  color: #f5222d;
}
</style>
