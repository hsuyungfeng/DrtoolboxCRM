<template>
  <div class="medical-order-list">
    <n-card title="醫令管理">
      <template #header-extra>
        <n-button type="primary" @click="openCreateDialog">
          開立醫令
        </n-button>
      </template>

      <n-tabs v-model:value="activeTab" type="line" animated>
        <!-- 全部 -->
        <n-tab-pane name="all" tab="全部">
          <MedicalOrderTable
            :orders="allOrders"
            :loading="loading"
            @edit="openEditDialog"
            @cancel="handleCancel"
          />
        </n-tab-pane>

        <!-- 待開始 -->
        <n-tab-pane name="pending" tab="待開始">
          <MedicalOrderTable
            :orders="pendingOrders"
            :loading="loading"
            @edit="openEditDialog"
            @cancel="handleCancel"
          />
        </n-tab-pane>

        <!-- 進行中 -->
        <n-tab-pane name="in_progress" tab="進行中">
          <MedicalOrderTable
            :orders="inProgressOrders"
            :loading="loading"
            @edit="openEditDialog"
            @cancel="handleCancel"
          />
        </n-tab-pane>

        <!-- 已完成 -->
        <n-tab-pane name="completed" tab="已完成">
          <MedicalOrderTable
            :orders="completedOrders"
            :loading="loading"
          />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 醫令表單對話框 -->
    <n-modal
      v-model:show="showFormDialog"
      :title="editingOrder ? '編輯醫令' : '開立醫令'"
      preset="card"
      style="width: 600px"
      :mask-closable="false"
    >
      <MedicalOrderForm
        :order="editingOrder"
        @save="handleSave"
        @cancel="closeFormDialog"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import {
  NCard,
  NButton,
  NTabs,
  NTabPane,
  NModal,
  NDataTable,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  useMessage,
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { medicalOrdersApi } from '@/services/medical-orders-api';
import type { MedicalOrder, CreateMedicalOrderData, UpdateMedicalOrderData } from '@/services/medical-orders-api';
import MedicalOrderForm from '@/components/MedicalOrderForm.vue';

const message = useMessage();
const orders = ref<MedicalOrder[]>([]);
const loading = ref(false);
const showFormDialog = ref(false);
const editingOrder = ref<MedicalOrder | null>(null);
const activeTab = ref('all');

/** 全部醫令 */
const allOrders = computed(() => orders.value);

/** 待開始醫令 */
const pendingOrders = computed(() =>
  orders.value.filter((o) => o.status === 'pending'),
);

/** 進行中醫令 */
const inProgressOrders = computed(() =>
  orders.value.filter((o) => o.status === 'in_progress'),
);

/** 已完成醫令 */
const completedOrders = computed(() =>
  orders.value.filter((o) => o.status === 'completed'),
);

/** 狀態標籤類型映射 */
const statusTypeMap: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  pending: 'default',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

/** 狀態中文標籤映射 */
const statusLabelMap: Record<string, string> = {
  pending: '待開始',
  in_progress: '進行中',
  completed: '已完成',
  cancelled: '已取消',
};

/** 載入所有醫令 */
const loadOrders = async () => {
  loading.value = true;
  try {
    const data = await medicalOrdersApi.getOrders();
    orders.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('載入醫令失敗:', error);
    message.error('載入醫令失敗');
  } finally {
    loading.value = false;
  }
};

/** 開啟建立對話框 */
const openCreateDialog = () => {
  editingOrder.value = null;
  showFormDialog.value = true;
};

/** 開啟編輯對話框 */
const openEditDialog = (order: MedicalOrder) => {
  editingOrder.value = { ...order };
  showFormDialog.value = true;
};

/** 關閉對話框 */
const closeFormDialog = () => {
  showFormDialog.value = false;
  editingOrder.value = null;
};

/** 保存醫令（建立或更新） */
const handleSave = async (data: CreateMedicalOrderData) => {
  try {
    if (editingOrder.value?.id) {
      const updateData: UpdateMedicalOrderData = {
        drugOrTreatmentName: data.drugOrTreatmentName,
        description: data.description,
        dosage: data.dosage,
        usageMethod: data.usageMethod,
        totalUsage: data.totalUsage,
      };
      await medicalOrdersApi.updateOrder(editingOrder.value.id, updateData);
      message.success('醫令已更新');
    } else {
      await medicalOrdersApi.createOrder(data);
      message.success('醫令已開立');
    }
    closeFormDialog();
    await loadOrders();
  } catch (error) {
    console.error('操作失敗:', error);
    message.error('操作失敗，請稍後重試');
  }
};

/** 取消醫令 */
const handleCancel = async (id: string) => {
  try {
    await medicalOrdersApi.cancelOrder(id);
    message.success('醫令已取消');
    await loadOrders();
  } catch (error) {
    console.error('取消失敗:', error);
    message.error('取消失敗，請稍後重試');
  }
};

onMounted(loadOrders);

/**
 * 內嵌醫令表格組件（避免循環依賴，直接以 defineComponent 定義）
 */
const MedicalOrderTable = {
  name: 'MedicalOrderTable',
  props: {
    orders: { type: Array as () => MedicalOrder[], default: () => [] },
    loading: { type: Boolean, default: false },
  },
  emits: ['edit', 'cancel'],
  setup(props: { orders: MedicalOrder[]; loading: boolean }, { emit }: { emit: (event: string, ...args: any[]) => void }) {
    const columns: DataTableColumns<MedicalOrder> = [
      {
        title: '患者',
        key: 'patientName',
        render: (row) => row.patientName ?? row.patientId ?? '-',
      },
      {
        title: '藥物或治療名稱',
        key: 'drugOrTreatmentName',
      },
      {
        title: '劑量',
        key: 'dosage',
      },
      {
        title: '使用方式',
        key: 'usageMethod',
      },
      {
        title: '使用進度',
        key: 'progress',
        render: (row) => `${row.usedCount ?? 0} / ${row.totalUsage}`,
      },
      {
        title: '狀態',
        key: 'status',
        render: (row) =>
          h(
            NTag,
            { type: statusTypeMap[row.status] ?? 'default', size: 'small' },
            { default: () => statusLabelMap[row.status] ?? row.status },
          ),
      },
      {
        title: '操作',
        key: 'actions',
        render: (row) => {
          const buttons = [];
          if (['pending', 'in_progress'].includes(row.status)) {
            buttons.push(
              h(
                NButton,
                {
                  size: 'small',
                  onClick: () => emit('edit', row),
                },
                { default: () => '編輯' },
              ),
            );
            buttons.push(
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  onClick: () => emit('cancel', row.id),
                },
                { default: () => '取消' },
              ),
            );
          }
          return h(NSpace, {}, { default: () => buttons });
        },
      },
    ];

    return () => {
      if (props.loading) {
        return h('div', { style: 'text-align: center; padding: 40px 0;' }, [
          h(NSpin, { size: 'medium' }),
        ]);
      }
      if (!props.orders.length) {
        return h(NEmpty, { description: '暫無醫令記錄' });
      }
      return h(NDataTable, {
        columns,
        data: props.orders,
        rowKey: (row: MedicalOrder) => row.id,
        striped: true,
      });
    };
  },
};
</script>

<style scoped>
.medical-order-list {
  padding: 24px;
}
</style>
