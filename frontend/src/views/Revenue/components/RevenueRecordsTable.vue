<template>
  <n-data-table
    :columns="recordColumns"
    :data="revenueRecords"
    :loading="loadingRecords"
    :pagination="pagination"
    :row-key="(row) => row.id"
  />
</template>

<script setup lang="ts">
import { NDataTable } from 'naive-ui';
import { useRevenue } from '@/composables/useRevenue';

const { 
  recordColumns, 
  revenueRecords, 
  loadingRecords 
} = useRevenue();

const pagination = {
  pageSize: 10,
};
</script>
