import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';

export const useUserStore = defineStore('user', () => {
  // 狀態
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const clinicId = ref<string | null>(localStorage.getItem('clinicId'));

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const getUserRole = computed(() => user.value?.role || null);
  const getClinicId = computed(() => clinicId.value);

  // Actions
  const setUser = (userData: User) => {
    user.value = userData;
  };

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };

  const setClinicId = (id: string) => {
    clinicId.value = id;
    localStorage.setItem('clinicId', id);
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    clinicId.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('clinicId');
  };

  const login = async (credentials: { username: string; password: string; clinicId: string }) => {
    // TODO: 實現實際的登入API調用
    // 暫時模擬登入
    const mockUser: User = {
      id: '1',
      username: credentials.username,
      name: '管理員',
      role: 'admin',
      clinicId: credentials.clinicId,
      email: 'admin@example.com',
      createdAt: new Date().toISOString(),
    };

    setUser(mockUser);
    setToken('mock-jwt-token');
    setClinicId(credentials.clinicId);

    return mockUser;
  };

  return {
    // 狀態
    user,
    token,
    clinicId,
    
    // Getters
    isAuthenticated,
    getUserRole,
    getClinicId,
    
    // Actions
    setUser,
    setToken,
    setClinicId,
    logout,
    login,
  };
});