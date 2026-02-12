<template>
  <n-layout has-sider style="height: 100vh;">
    <app-sidebar
      v-if="showSidebar"
      :collapsed="sidebarCollapsed"
      @update:collapsed="sidebarCollapsed = $event"
    />

    <n-layout>
      <app-header
        v-if="showHeader"
        :show-sidebar-toggle="showSidebar"
        @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
      />

      <n-layout-content
        :native-scrollbar="false"
        :content-style="contentStyle"
        style="padding: 24px;"
      >
        <div class="layout-content">
          <router-view />
        </div>
      </n-layout-content>

      <n-layout-footer bordered v-if="showFooter">
        <div class="footer-content">
          <span>© 2026 Doctor CRM - 醫療診所客戶關係管理系統</span>
          <span style="color: #999; font-size: 12px;">版本 0.0.1</span>
        </div>
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import {
  NLayout, NLayoutContent, NLayoutFooter,
} from 'naive-ui';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';

// Props
interface Props {
  showHeader?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showSidebar: true,
  showFooter: true,
});

// State
const sidebarCollapsed = ref(false);
// const route = useRoute(); // 保留以備將來使用

// Computed
const contentStyle = computed(() => ({
  paddingTop: props.showHeader ? '64px' : '0',
  minHeight: 'calc(100vh - 64px)',
}));

// 根據路由決定是否顯示佈局元素（保留以備將來使用）
// const shouldShowLayout = computed(() => {
//   const hideLayoutRoutes = ['/login'];
//   return !hideLayoutRoutes.includes(route.path);
// });
</script>

<style scoped>
.layout-content {
  width: 100%;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  color: #666;
  font-size: 14px;
}
</style>