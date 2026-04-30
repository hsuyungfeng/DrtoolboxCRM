<template>
  <n-data-table
    :columns="adjustmentColumns"
    :data="revenueAdjustments"
    :loading="loadingAdjustments"
    :pagination="pagination"
    :row-key="(row) => row.id"
  />
</template>

<script setup lang="ts">
import { NDataTable } from 'naive-ui';
import { useRevenue } from '@/composables/useRevenue';

const {
  adjustmentColumns,
  revenueAdjustments,
  loadingAdjustments
} = useRevenue();

const pagination = {
  pageSize: 10,
};
</script>
