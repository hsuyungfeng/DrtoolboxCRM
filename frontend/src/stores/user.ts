import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';

const CLINIC_ID_STORAGE_KEY = 'crm_clinic_id';
const CLINIC_IDS_KEY = 'crm_clinic_ids';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const clinicId = ref<string | null>(localStorage.getItem(CLINIC_ID_STORAGE_KEY));
  const availableClinics = ref<Array<{ id: string; name: string }>>([]);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const getUserRole = computed(() => user.value?.role || null);
  const getClinicId = computed(() => {
    if (!clinicId.value && user.value?.clinicId) {
      clinicId.value = user.value.clinicId;
    }
    return clinicId.value;
  });

  const hasMultipleClinics = computed(() => availableClinics.value.length > 1);

  function validateClinicId(id: string): boolean {
    if (!id) return false;
    if (user.value?.role === 'super_admin') return true;
    if (availableClinics.value.length > 0) {
      return availableClinics.value.some(c => c.id === id);
    }
    return id === user.value?.clinicId;
  }

  function setUser(userData: User) {
    user.value = userData;
    if (userData.clinicId) {
      if (!clinicId.value) {
        clinicId.value = userData.clinicId;
        localStorage.setItem(CLINIC_ID_STORAGE_KEY, userData.clinicId);
      }
      availableClinics.value = [{ id: userData.clinicId, name: userData.clinicName || '預設診所' }];
      localStorage.setItem(CLINIC_IDS_KEY, JSON.stringify(availableClinics.value));
    }
  }

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  function setClinicId(id: string) {
    if (!validateClinicId(id)) {
      console.error(`Invalid clinic ID: ${id}`);
      return;
    }
    clinicId.value = id;
    localStorage.setItem(CLINIC_ID_STORAGE_KEY, id);
  }

  function switchClinic(id: string) {
    if (!validateClinicId(id)) {
      throw new Error('無權限訪問此診所');
    }
    setClinicId(id);
  }

  function logout() {
    user.value = null;
    token.value = null;
    clinicId.value = null;
    availableClinics.value = [];
    localStorage.removeItem('token');
    localStorage.removeItem(CLINIC_ID_STORAGE_KEY);
    localStorage.removeItem(CLINIC_IDS_KEY);
  }

  async function login(credentials: { username: string; password: string; clinicId: string }) {
    const mockUser: User = {
      id: '1',
      username: credentials.username,
      name: '管理員',
      role: 'admin',
      clinicId: credentials.clinicId,
      clinicName: '示範診所',
      email: 'admin@example.com',
      createdAt: new Date().toISOString(),
    };

    setUser(mockUser);
    setToken('mock-jwt-token');
    setClinicId(credentials.clinicId);

    return mockUser;
  }

  return {
    user,
    token,
    clinicId,
    availableClinics,
    isAuthenticated,
    getUserRole,
    getClinicId,
    hasMultipleClinics,
    validateClinicId,
    setUser,
    setToken,
    setClinicId,
    switchClinic,
    logout,
    login,
  };
});