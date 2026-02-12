<template>
  <n-layout-header
    bordered
    position="absolute"
    style="height: 64px; padding: 0 24px;"
    class="app-header"
  >
    <div class="header-content">
      <div class="header-left">
        <n-button
          quaternary
          circle
          @click="toggleSidebar"
          v-if="showSidebarToggle"
        >
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </n-icon>
          </template>
        </n-button>
        <div class="logo">
          <router-link to="/" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
            <n-icon size="28" style="margin-right: 12px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83v-4.7l6-2.25 6 2.25v4.7z"/>
              </svg>
            </n-icon>
            <span style="font-size: 20px; font-weight: bold;">Doctor CRM</span>
          </router-link>
        </div>
      </div>

      <div class="header-center">
        <n-space>
          <n-button
            v-for="item in navItems"
            :key="item.key"
            :type="activeNav === item.key ? 'primary' : 'default'"
            quaternary
            :to="item.to"
          >
            <template #icon>
              <n-icon>
                <component :is="item.icon" />
              </n-icon>
            </template>
            {{ item.label }}
          </n-button>
        </n-space>
      </div>

      <div class="header-right">
        <n-dropdown
          :options="userOptions"
          placement="bottom-end"
          @select="handleUserAction"
        >
          <n-button quaternary>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </n-icon>
            </template>
              {{ userStore.user?.name || '用戶' }} ▼
          </n-button>
        </n-dropdown>
      </div>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  NLayoutHeader, NButton, NIcon, NSpace, NDropdown,
} from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import { useUserStore } from '@/stores/user';

// Props
interface Props {
  showSidebarToggle?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  showSidebarToggle: true,
});

// Emits
const emit = defineEmits<{
  toggleSidebar: [];
}>();

// Stores
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

// State
const activeNav = computed(() => {
  const path = route.path;
  if (path.startsWith('/patients')) return 'patients';
  if (path.startsWith('/treatments')) return 'treatments';
  if (path.startsWith('/staff')) return 'staff';
  if (path.startsWith('/revenue')) return 'revenue';
  if (path === '/') return 'home';
  return '';
});

// Navigation items
const navItems = [
  {
    key: 'home',
    label: '首頁',
    to: '/',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' }),
    ]),
  },
  {
    key: 'patients',
    label: '患者',
    to: '/patients',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }),
    ]),
  },
  {
    key: 'treatments',
    label: '療程',
    to: '/treatments',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' }),
    ]),
  },
  {
    key: 'staff',
    label: '員工',
    to: '/staff',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' }),
    ]),
  },
  {
    key: 'revenue',
    label: '分潤',
    to: '/revenue',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' }),
    ]),
  },
];

// User dropdown options
const userOptions: DropdownOption[] = [
  {
    label: '個人資料',
    key: 'profile',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' }),
    ])),
  },
  {
    label: '設定',
    key: 'settings',
    icon: () => h(NIcon, {}, () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' }),
    ])),
  },
  {
    type: 'divider',
    key: 'divider',
  },
  {
    label: '登出',
    key: 'logout',
    icon: () => h(NIcon, {}, () =>        h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' }),
    ])),
  },
];

// Methods
function toggleSidebar() {
  emit('toggleSidebar');
}

function handleUserAction(key: string | number) {
  if (key === 'logout') {
    userStore.logout();
    router.push('/login');
  } else if (key === 'profile') {
    // TODO: 跳轉到個人資料頁面
    console.log('個人資料');
  } else if (key === 'settings') {
    // TODO: 跳轉到設定頁面
    console.log('設定');
  }
}
</script>

<style scoped>
.app-header {
  background: white;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}
</style>