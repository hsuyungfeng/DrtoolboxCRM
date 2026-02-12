<template>
  <n-config-provider :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-dialog-provider>
      <n-message-provider>
        <n-notification-provider>
          <div id="app">
            <router-view v-if="!shouldShowLayout" />
            <app-layout v-else />
          </div>
        </n-notification-provider>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider, zhTW, enUS, dateZhTW, dateEnUS } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import AppLayout from './components/AppLayout.vue';

const route = useRoute();
const { locale } = useI18n();

const shouldShowLayout = computed(() => {
  const hideLayoutRoutes = ['/login', '/404'];
  return !hideLayoutRoutes.includes(route.path) && !route.path.startsWith('/login');
});

// Naive UI 語言配置
const naiveLocale = computed(() => {
  return locale.value === 'zh-TW' ? zhTW : enUS;
});

const naiveDateLocale = computed(() => {
  return locale.value === 'zh-TW' ? dateZhTW : dateEnUS;
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.n-layout {
  background-color: #f5f5f5;
}

.n-layout-content {
  background-color: #f5f5f5;
}
</style>