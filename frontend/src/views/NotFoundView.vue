<template>
  <div class="not-found-view">
    <div class="not-found-container">
      <n-result
        status="404"
        title="404 頁面未找到"
        description="抱歉，您訪問的頁面不存在或已被移除"
      >
        <template #icon>
          <n-icon size="120">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 0h24v24H0V0z" fill="none"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </n-icon>
        </template>

        <div class="not-found-actions">
          <n-space justify="center">
            <n-button type="primary" @click="goHome">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </n-icon>
              </template>
              返回首頁
            </n-button>
            <n-button secondary @click="goBack">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                </n-icon>
              </template>
              返回上頁
            </n-button>
          </n-space>
        </div>
      </n-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { NResult, NButton, NSpace, NIcon } from 'naive-ui';

const router = useRouter();

function goHome() {
  router.push('/');
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.not-found-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-container {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.not-found-actions {
  margin-top: 32px;
}
</style>