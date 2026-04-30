import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { User } from '@/types';
import { authApi } from '@/services/api';

const CLINIC_ID_STORAGE_KEY = 'crm_clinic_id';
const CLINIC_IDS_KEY = 'crm_clinic_ids';
const INTEGRATED_MODE_KEY = 'crm_integrated_mode';
const TOKEN_KEY = 'token';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const clinicId = ref<string | null>(localStorage.getItem(CLINIC_ID_STORAGE_KEY));
  const isIntegrated = ref<boolean>(localStorage.getItem(INTEGRATED_MODE_KEY) === 'true');
  const availableClinics = ref<Array<{ id: string; name: string }>>([]);

  // 初始化邏輯：如果是在整合模式，確保 User 物件存在
  const initUser = () => {
    if (isIntegrated.value && !user.value) {
      user.value = {
        id: 'integrated-user',
        username: 'app_user',
        name: '整合模式',
        role: 'admin',
        clinicId: clinicId.value || 'clinic_001',
      } as any;
      if (!token.value) {
        token.value = 'app-integrated-token';
        localStorage.setItem(TOKEN_KEY, 'app-integrated-token');
      }
    }
  };

  // 執行初始化
  initUser();

  const isAuthenticated = computed(() => isIntegrated.value || (!!token.value && !!user.value));
  
  const getUserRole = computed(() => {
    if (user.value?.role) return user.value.role;
    if (isIntegrated.value) return 'admin';
    return null;
  });
  
  const getClinicId = computed(() => {
    return clinicId.value || localStorage.getItem(CLINIC_ID_STORAGE_KEY) || 'clinic_001';
  });

  function setUser(userData: User) {
    user.value = userData;
    if (userData.clinicId) {
      setClinicId(userData.clinicId);
    }
  }

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem(TOKEN_KEY, newToken);
  }

  function setClinicId(id: string) {
    clinicId.value = id;
    localStorage.setItem(CLINIC_ID_STORAGE_KEY, id);
  }

  function setIntegratedMode(value: boolean) {
    isIntegrated.value = value;
    localStorage.setItem(INTEGRATED_MODE_KEY, value.toString());
    initUser();
  }

  function logout() {
    user.value = null;
    token.value = null;
    clinicId.value = null;
    isIntegrated.value = false;
    availableClinics.value = [];
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CLINIC_ID_STORAGE_KEY);
    localStorage.removeItem(CLINIC_IDS_KEY);
    localStorage.removeItem(INTEGRATED_MODE_KEY);
  }

  async function login(credentials: { username: string; password: string; clinicId: string }) {
    const response = await authApi.login(credentials);
    setIntegratedMode(false);
    setToken(response.accessToken);
    setUser(response.user);
    return response.user;
  }

  async function loginViaSSO(params: { clinicId: string; staffId: string; ts: string; sig: string; name?: string; role?: string }) {
    const response = await authApi.sso(params);
    setIntegratedMode(false);
    setToken(response.accessToken);
    setUser(response.user);
    return response.user;
  }

  return {
    user,
    token,
    clinicId,
    isIntegrated,
    isAuthenticated,
    getUserRole,
    getClinicId,
    setUser,
    setToken,
    setClinicId,
    setIntegratedMode,
    logout,
    login,
    loginViaSSO,
  };
});