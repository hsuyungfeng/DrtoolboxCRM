<template>
  <div class="reconciliation-table">
    <n-alert v-if="discrepancyCount > 0" type="error" title="發現對帳差異" style="margin-bottom: 16px">
      最近 30 天內發現 {{ discrepancyCount }} 筆數據不一致，請儘速核對 Doctor Toolbox 與 CRM 的財務記錄。
    </n-alert>

    <n-data-table
      :columns="columns"
      :data="reports"
      :loading="loading"
      :pagination="pagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue';
import { NDataTable, NTag, NAlert, NText } from 'naive-ui';
import api from '@/services/api';

// 這裡我們直接呼叫 API 獲取報告
const reports = ref([]);
const loading = ref(false);

const columns = [
  { title: '報告日期', key: 'reportDate' },
  { 
    title: 'CRM 總額', 
    key: 'crmTotalAmount',
    render: (row) => h(NText, { type: 'info' }, { default: () => `$${Number(row.crmTotalAmount).toLocaleString()}` })
  },
  { 
    title: 'Toolbox 總額', 
    key: 'externalTotalAmount',
    render: (row) => h(NText, { type: 'success' }, { default: () => `$${Number(row.externalTotalAmount).toLocaleString()}` })
  },
  { 
    title: '差異金額', 
    key: 'discrepancyAmount',
    render: (row) => {
      const amount = Number(row.discrepancyAmount);
      return h(NText, { type: amount === 0 ? 'default' : 'error', strong: amount !== 0 }, 
        { default: () => `$${amount.toLocaleString()}` }
      );
    }
  },
  {
    title: '狀態',
    key: 'status',
    render: (row) => {
      const typeMap = { matched: 'success', discrepancy: 'error', failed: 'warning' };
      const labelMap = { matched: '吻合', discrepancy: '不一致', failed: '失敗' };
      return h(NTag, { type: typeMap[row.status], size: 'small' }, { default: () => labelMap[row.status] });
    }
  },
  { title: '對帳時間', key: 'createdAt' }
];

const pagination = { pageSize: 10 };

const discrepancyCount = computed(() => {
  return reports.value.filter(r => r.status === 'discrepancy').length;
});

onMounted(async () => {
  loading.value = true;
  try {
    const response = await api.get('/revenue-reports/reconciliation/reports');
    reports.value = response.data;
  } catch (err) {
    console.error('載入對帳報告失敗', err);
  } finally {
    loading.value = false;
  }
});
</script>
