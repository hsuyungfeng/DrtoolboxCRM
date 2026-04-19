<template>
  <div class="login-view">
    <div class="login-container">
      <n-card class="login-card">
        <div class="logo-section">
          <h1>Doctor CRM</h1>
          <p>醫療診所客戶關係管理系統</p>
        </div>

        <n-form
          ref="formRef"
          :model="formValue"
          :rules="rules"
          size="large"
        >
          <n-form-item label="用戶名" path="username">
            <n-input
              v-model:value="formValue.username"
              placeholder="請輸入用戶名"
              :input-props="{ autocomplete: 'username' }"
            >
              <template #prefix>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </n-icon>
              </template>
            </n-input>
          </n-form-item>

          <n-form-item label="密碼" path="password">
            <n-input
              v-model:value="formValue.password"
              type="password"
              placeholder="請輸入密碼"
              :input-props="{ autocomplete: 'current-password' }"
              @keydown.enter="handleLogin"
            >
              <template #prefix>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-input>
          </n-form-item>

          <n-form-item label="診所 ID" path="clinicId">
            <n-input
              v-model:value="formValue.clinicId"
              placeholder="請輸入診所 ID"
            >
              <template #prefix>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83v-4.7l6-2.25 6 2.25v4.7z"/>
                  </svg>
                </n-icon>
              </template>
            </n-input>
          </n-form-item>

          <div style="margin-bottom: 24px;">
            <n-checkbox v-model:checked="rememberMe">
              記住我
            </n-checkbox>
          </div>

          <n-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%;"
          >
            登入
          </n-button>
        </n-form>

        <div class="login-footer">
          <p>© 2026 Doctor CRM - 醫療診所管理系統</p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import {
  NButton, NForm, NFormItem, NInput, NIcon, NCheckbox, NCard,
} from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { useUserStore } from '@/stores/user';
import { authService } from '@/services/auth.service';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const userStore = useUserStore();
const message = useMessage();
const { t } = useI18n();

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const rememberMe = ref(false);
const formValue = ref({
  username: '',
  password: '',
  clinicId: 'clinic_001',
});

const rules: FormRules = {
  username: [
    { required: true, message: t('auth.username') + t('common.required'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('auth.password') + t('common.required'), trigger: 'blur' },
  ],
  clinicId: [
    { required: true, message: t('clinic.clinicId') + t('common.required'), trigger: 'blur' },
  ],
};

async function handleLogin() {
  try {
    loading.value = true;

    // 驗證表單
    await formRef.value?.validate();

    // 呼叫後端 API
    const response = await authService.login({
      username: formValue.value.username,
      password: formValue.value.password,
      clinicId: formValue.value.clinicId,
    });

    // 保存用戶資訊和 token
    userStore.setUser(response.user);
    userStore.setToken(response.accessToken);
    userStore.setClinicId(response.user.clinicId);

    message.success(t('auth.loginSuccess'));

    // 跳轉到首頁（或原始目標 URL）
    const redirect = router.currentRoute.value.query.redirect as string;
    router.push(redirect || '/');
  } catch (error: any) {
    const errorMessage = error?.message || t('auth.loginFailed');
    message.error(errorMessage);
    console.error('登入失敗:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-section h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: bold;
}

.logo-section p {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 14px;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.n-form-item {
  margin-bottom: 24px;
}
</style>