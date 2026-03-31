<template>
  <n-message-provider>
    <n-dialog-provider>
      <div class="treatment-list">
        <div class="page-header">
          <h1>療程管理</h1>
          <n-space>
            <n-button type="primary" @click="openCreateDialog">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </n-icon>
              </template>
              新增療程
            </n-button>
            <n-button secondary @click="loadTreatments">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"
                    />
                  </svg>
                </n-icon>
              </template>
              刷新
            </n-button>
          </n-space>
        </div>

        <n-card>
          <n-data-table
            :columns="columns"
            :data="treatments"
            :loading="loading"
            :pagination="pagination"
            :row-key="(row: TreatmentRow) => row.id"
            striped
          />
        </n-card>

        <!-- 建立/編輯對話框 -->
        <n-modal
          v-model:show="showFormDialog"
          preset="card"
          title="療程資訊"
          style="width: 640px"
          :mask-closable="false"
        >
          <TreatmentForm
            :treatment="editingTreatment"
            @save="handleSave"
            @cancel="closeFormDialog"
          />
        </n-modal>
      </div>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  NButton,
  NTag,
  NSpace,
  NIcon,
  NDataTable,
  NCard,
  NModal,
  NMessageProvider,
  NDialogProvider,
  useMessage,
  useDialog,
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { treatmentsApi } from '@/services/treatments-api';
import { useUserStore } from '@/stores/user';
import TreatmentForm from '@/components/TreatmentForm.vue';

interface TreatmentFormData {
  name: string;
  patientId: string;
  description?: string;
  templateId?: string;
  totalSessions: number;
  costPerSession?: number;
}

/** 療程列表行資料型別 */
interface TreatmentRow {
  id: string;
  name: string;
  patient?: { name?: string };
  patientName?: string;
  totalSessions: number;
  completedSessions?: number;
  progress?: { completedSessions?: number; totalSessions?: number };
  status: string;
  costPerSession?: number;
  type?: string;
  createdAt?: string;
}

const router = useRouter();
const userStore = useUserStore();
const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const treatments = ref<TreatmentRow[]>([]);
const showFormDialog = ref(false);
const editingTreatment = ref<TreatmentRow | null>(null);

const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const pagination = { pageSize: 10 };

/** 狀態中文映射 */
const statusMap: Record<string, { text: string; type: 'default' | 'info' | 'success' | 'error' | 'warning' }> = {
  pending: { text: '待開始', type: 'default' },
  in_progress: { text: '進行中', type: 'info' },
  active: { text: '進行中', type: 'info' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'error' },
};

const columns: DataTableColumns<TreatmentRow> = [
  {
    title: '療程名稱',
    key: 'name',
  },
  {
    title: '患者',
    key: 'patientName',
    render: (row) => row.patient?.name || row.patientName || '-',
  },
  {
    title: '總課程數',
    key: 'totalSessions',
    width: 100,
  },
  {
    title: '進度',
    key: 'progress',
    render: (row) => {
      const completed = row.progress?.completedSessions ?? row.completedSessions ?? 0;
      const total = row.progress?.totalSessions ?? row.totalSessions ?? 1;
      return `${completed} / ${total}`;
    },
  },
  {
    title: '狀態',
    key: 'status',
    render: (row) => {
      const s = statusMap[row.status] ?? { text: row.status, type: 'default' as const };
      return h(NTag, { type: s.type }, { default: () => s.text });
    },
  },
  {
    title: '建立日期',
    key: 'createdAt',
    width: 130,
    render: (row) =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString('zh-TW') : '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row) =>
      h(NSpace, {}, [
        h(
          NButton,
          { size: 'small', onClick: () => viewTreatment(row.id) },
          { default: () => '查看' },
        ),
        h(
          NButton,
          { size: 'small', type: 'warning', onClick: () => openEditDialog(row) },
          { default: () => '編輯' },
        ),
        h(
          NButton,
          { size: 'small', type: 'error', onClick: () => handleDelete(row.id) },
          { default: () => '刪除' },
        ),
      ]),
  },
];

/** 載入療程列表 */
const loadTreatments = async () => {
  loading.value = true;
  try {
    const data = await treatmentsApi.getTreatments({ clinicId: clinicId.value });
    treatments.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('載入療程失敗:', error);
    message.error('載入療程失敗');
  } finally {
    loading.value = false;
  }
};

/** 查看療程詳情 */
function viewTreatment(id: string) {
  router.push({ name: 'TreatmentDetail', params: { id } });
}

/** 開啟新增對話框 */
const openCreateDialog = () => {
  editingTreatment.value = null;
  showFormDialog.value = true;
};

/** 開啟編輯對話框 */
const openEditDialog = (treatment: TreatmentRow) => {
  editingTreatment.value = { ...treatment };
  showFormDialog.value = true;
};

/** 關閉對話框 */
const closeFormDialog = () => {
  showFormDialog.value = false;
  editingTreatment.value = null;
};

/** 儲存療程（新增或更新） */
const handleSave = async (data: TreatmentFormData) => {
  try {
    if (editingTreatment.value?.id) {
      await treatmentsApi.updateTreatment(editingTreatment.value.id, data);
      message.success('療程已更新');
    } else {
      await treatmentsApi.createTreatment(data);
      message.success('療程已建立');
    }
    closeFormDialog();
    await loadTreatments();
  } catch (error) {
    console.error('儲存療程失敗:', error);
    message.error('操作失敗，請重試');
  }
};

/** 刪除療程 */
const handleDelete = (id: string) => {
  dialog.warning({
    title: '確認刪除',
    content: '確定要刪除這個療程嗎？此操作無法撤銷。',
    positiveText: '刪除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await treatmentsApi.deleteTreatment(id);
        message.success('療程已刪除');
        await loadTreatments();
      } catch (error) {
        console.error('刪除療程失敗:', error);
        message.error('刪除失敗，請重試');
      }
    },
  });
};

onMounted(loadTreatments);
</script>

<style scoped>
.treatment-list {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  color: #333;
}
</style>
