<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="200"
    :collapsed="collapsed"
    show-trigger
    @collapse="collapsed = true"
    @expand="collapsed = false"
    class="app-sidebar"
  >
    <div class="sidebar-header">
      <div class="logo" v-if="!collapsed">
        <router-link to="/" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
          <n-icon size="32" style="margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83v-4.7l6-2.25 6 2.25v4.7z"/>
            </svg>
          </n-icon>
          <span style="font-size: 18px; font-weight: bold;">Doctor CRM</span>
        </router-link>
      </div>
      <div class="logo-collapsed" v-else>
        <router-link to="/" style="display: flex; align-items: center; justify-content: center;">
          <n-icon size="32">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83v-4.7l6-2.25 6 2.25v4.7z"/>
            </svg>
          </n-icon>
        </router-link>
      </div>
    </div>

    <n-menu
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :value="activeKey"
      @update:value="handleMenuSelect"
    />

    <div class="sidebar-footer" v-if="!collapsed">
      <div class="clinic-info">
        <n-tag type="info" size="small" round>
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83v-4.7l6-2.25 6 2.25v4.7z"/>
              </svg>
            </n-icon>
          </template>
          {{ userStore.clinicId || '未設定診所' }}
        </n-tag>
      </div>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  NLayoutSider, NMenu, NIcon, NTag,
} from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import { useUserStore } from '@/stores/user';

// Props
interface Props {
  collapsed?: boolean;
}
const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:collapsed': [value: boolean];
}>();

// Stores
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

// State
const collapsed = ref(false);

// Computed
const activeKey = computed(() => route.path);

// Menu options
const menuOptions: MenuOption[] = [
  {
    label: () => h('router-link', { to: '/', style: { textDecoration: 'none', color: 'inherit' } }, '首頁'),
    key: '/',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' }),
    ])),
  },
  {
    label: '患者管理',
    key: '/patients',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }),
    ])),
  },
  {
    label: '療程管理',
    key: '/treatments',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' }),
    ])),
  },
  {
    label: '排程管理',
    key: '/schedule',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z' }),
    ])),
  },
  {
    label: '員工管理',
    key: '/staff',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' }),
    ])),
  },
  {
    label: '分潤管理',
    key: '/revenue',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' }),
    ])),
  },
  {
    label: '系統設定',
    key: 'settings',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' }),
    ])),
    children: [
      {
        label: '診所設定',
        key: '/settings/clinic',
      },
      {
        label: '分潤規則',
        key: '/settings/revenue-rules',
      },
      {
        label: '權限管理',
        key: '/settings/permissions',
      },
    ],
  },
];

// Methods
function handleMenuSelect(key: string) {
  if (key.startsWith('/')) {
    router.push(key);
  }
}
</script>

<style scoped>
.app-sidebar {
  background: white;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
}

.clinic-info {
  display: flex;
  justify-content: center;
}
</style>