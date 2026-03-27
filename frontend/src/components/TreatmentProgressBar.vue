<template>
  <div class="progress-container">
    <div class="progress-info">
      <span>{{ completed }} / {{ total }} 已完成</span>
      <span class="percentage">{{ progressPercent }}%</span>
    </div>
    <n-progress
      :percentage="progressPercent"
      :height="24"
      :rail-size="8"
      type="line"
      color="#4CAF50"
      rail-color="#E0E0E0"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NProgress } from 'naive-ui';

/** 進度條屬性 */
const props = withDefaults(
  defineProps<{
    /** 已完成課程數 */
    completed: number;
    /** 總課程數 */
    total: number;
  }>(),
  {
    completed: 0,
    total: 1,
  },
);

/** 計算百分比（0–100，整數） */
const progressPercent = computed(() =>
  props.total > 0 ? Math.round((props.completed / props.total) * 100) : 0,
);
</script>

<style scoped>
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.percentage {
  font-weight: bold;
  color: #4caf50;
}
</style>
