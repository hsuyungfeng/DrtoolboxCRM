<template>
  <div class="treatments-view">
    <div class="page-header">
      <h1>療程管理</h1>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
          </template>
          新增療程
        </n-button>
        <n-button secondary @click="loadTreatments">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
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
        :row-key="(row) => row.id"
      />
    </n-card>

    <!-- 新增療程模態框 -->
    <treatment-modal
      v-model:show="showCreateModal"
      :title="'新增療程'"
      @confirm="handleCreate"
    />

    <!-- 編輯療程模態框 -->
    <treatment-modal
      v-model:show="showEditModal"
      :title="`編輯療程`"
      :treatment="editingTreatment"
      @confirm="handleEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { NButton, NTag, NSpace, NIcon, NDataTable, NCard } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { Treatment } from '@/types';
import { treatmentsApi } from '@/services/api';
import { useUserStore } from '@/stores/user';
import TreatmentModal from '@/components/TreatmentModal.vue';

const userStore = useUserStore();
const loading = ref(false);
const treatments = ref<Treatment[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingTreatment = ref<Treatment | null>(null);

const clinicId = computed(() => userStore.clinicId || 'clinic_001');

const pagination = { pageSize: 10 };

const columns: DataTableColumns<Treatment> = [
  {
    title: '患者',
    key: 'patient.name',
    render: (row) => row.patient?.name || '-',
  },
  {
    title: '療程名稱',
    key: 'name',
  },
  {
    title: '實際售價',
    key: 'totalPrice',
    render: (row) => `¥${row.totalPrice}`,
  },
  {
    title: '進度',
    key: 'completedSessions',
    render: (row) => `${row.completedSessions}/${row.totalSessions}`,
  },
  {
    title: '狀態',
    key: 'status',
    render: (row) => {
      const statusMap = {
        pending: { text: '待開始', type: 'default' as const },
        in_progress: { text: '進行中', type: 'info' as const },
        completed: { text: '已完成', type: 'success' as const },
        cancelled: { text: '已取消', type: 'error' as const },
      };
      const status = statusMap[row.status] || statusMap.pending;
      return h(NTag, { type: status.type }, { default: () => status.text });
    },
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) =>
      h(NSpace, {}, [
        h(NButton, { size: 'small', onClick: () => editTreatment(row) }, { default: () => '編輯' }),
        h(NButton, { size: 'small', type: 'error', onClick: () => deleteTreatment(row.id) }, { default: () => '刪除' }),
      ]),
  },
];

onMounted(() => loadTreatments());

async function loadTreatments() {
  try {
    loading.value = true;
    treatments.value = await treatmentsApi.getAll(clinicId.value);
  } catch (error) {
    console.error('加載療程失敗:', error);
  } finally {
    loading.value = false;
  }
}

function editTreatment(treatment: Treatment) {
  editingTreatment.value = treatment;
  showEditModal.value = true;
}

async function handleCreate(formData: any) {
  try {
    await treatmentsApi.create({ ...formData, clinicId: clinicId.value });
    showCreateModal.value = false;
    await loadTreatments();
  } catch (error) {
    console.error('新增療程失敗:', error);
  }
}

async function handleEdit(formData: any) {
  if (!editingTreatment.value) return;
  try {
    await treatmentsApi.update(editingTreatment.value.id, formData);
    showEditModal.value = false;
    await loadTreatments();
  } catch (error) {
    console.error('編輯療程失敗:', error);
  }
}

async function deleteTreatment(id: string) {
  try {
    await treatmentsApi.delete(id);
    await loadTreatments();
  } catch (error) {
    console.error('刪除療程失敗:', error);
  }
}
</script>

<style scoped>
.treatments-view {
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
