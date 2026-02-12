import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiErrorResponse } from '@/types';
import { useUserStore } from '@/stores/user';

// 創建 Axios 實例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 請求攔截器
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const userStore = useUserStore();
      
      // 添加認證 token
      if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`;
      }

      // 添加診所 ID（如果存在）
      if (userStore.clinicId) {
        config.headers['X-Clinic-Id'] = userStore.clinicId;
      }

      // 添加請求時間戳（防止緩存）
      if (config.method?.toLowerCase() === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 響應攔截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // 直接返回數據部分
      if (response.data?.data !== undefined) {
        return response.data.data;
      }
      return response.data;
    },
    (error) => {
      // 處理錯誤響應
      const errorResponse: ApiErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || '網絡錯誤，請檢查網絡連接',
        errorCode: error.response?.data?.errorCode || 'NETWORK_ERROR',
        timestamp: new Date().toISOString(),
        path: error.config?.url,
        details: error.response?.data?.details,
        errors: error.response?.data?.errors,
      };

      // 處理特定狀態碼
      switch (errorResponse.statusCode) {
        case 401:
          // 未授權，清除用戶狀態並跳轉到登入頁面
          const userStore = useUserStore();
          userStore.logout();
          window.location.href = '/login';
          break;
        case 403:
          // 權限不足
          console.warn('權限不足:', errorResponse.message);
          break;
        case 404:
          // 資源未找到
          console.warn('資源未找到:', errorResponse.path);
          break;
        case 422:
          // 驗證錯誤
          console.warn('驗證錯誤:', errorResponse.errors);
          break;
        default:
          console.error('API 錯誤:', errorResponse);
      }

      return Promise.reject(errorResponse);
    },
  );

  return instance;
};

// 創建 API 實例
const api = createApiInstance();

// 封裝常用的 HTTP 方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.get(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.post(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.put(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.patch(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.delete(url, config),
};

// 各模塊的 API 服務
export const patientsApi = {
  getAll: (clinicId: string, params?: any) => 
    http.get('/patients', { params: { clinicId, ...params } }),
  
  getById: (id: string, clinicId: string) => 
    http.get(`/patients/${id}`, { params: { clinicId } }),
  
  create: (data: any) => http.post('/patients', data),
  
  update: (id: string, data: any) => http.put(`/patients/${id}`, data),
  
  delete: (id: string) => http.delete(`/patients/${id}`),
};

export const treatmentsApi = {
  getAll: (clinicId: string, params?: any) =>
    http.get('/treatments', { params: { clinicId, ...params } }),

  getById: (id: string) =>
    http.get(`/treatments/${id}`),

  create: (data: any) => http.post('/treatments', data),

  update: (id: string, data: any) => http.put(`/treatments/${id}`, data),

  delete: (id: string) => http.delete(`/treatments/${id}`),
};

export const staffApi = {
  getAll: (clinicId: string, params?: any) => 
    http.get('/staff', { params: { clinicId, ...params } }),
  
  getById: (id: string, clinicId: string) => 
    http.get(`/staff/${id}`, { params: { clinicId } }),
  
  create: (data: any) => http.post('/staff', data),
  
  update: (id: string, data: any) => http.put(`/staff/${id}`, data),
  
  delete: (id: string) => http.delete(`/staff/${id}`),
  
  getByRole: (clinicId: string, role: string) => 
    http.get('/staff', { params: { clinicId, role } }),
};

export const revenueApi = {
  // 分潤規則
  getRules: (clinicId: string, params?: any) => 
    http.get('/revenue-rules', { params: { clinicId, ...params } }),
  
  getRuleById: (id: string, clinicId: string) => 
    http.get(`/revenue-rules/${id}`, { params: { clinicId } }),
  
  createRule: (data: any) => http.post('/revenue-rules', data),
  
  updateRule: (id: string, data: any) => http.put(`/revenue-rules/${id}`, data),
  
  deleteRule: (id: string) => http.delete(`/revenue-rules/${id}`),
  
  // 分潤記錄
  getRecords: (clinicId: string, params?: any) => 
    http.get('/revenue-records', { params: { clinicId, ...params } }),
  
  getRecordById: (id: string, clinicId: string) => 
    http.get(`/revenue-records/${id}`, { params: { clinicId } }),
  
  lockRecord: (id: string) => http.patch(`/revenue-records/${id}/lock`),
  
  unlockRecord: (id: string) => http.patch(`/revenue-records/${id}/unlock`),
  
  markRecordPaid: (id: string) => http.patch(`/revenue-records/${id}/paid`),
  
  // 分潤計算
  calculateRevenue: (data: any) => http.post('/revenue-calculator/calculate', data),
};

export const revenueAdjustmentApi = {
  // 分潤調整
  getAdjustments: (clinicId: string, params?: any) => 
    http.get('/revenue-adjustments', { params: { clinicId, ...params } }),
  
  getAdjustmentById: (id: string, clinicId: string) => 
    http.get(`/revenue-adjustments/${id}`, { params: { clinicId } }),
  
  createAdjustment: (data: any) => http.post('/revenue-adjustments', data),
  
  updateAdjustment: (id: string, data: any) => http.patch(`/revenue-adjustments/${id}`, data),
  
  deleteAdjustment: (id: string) => http.delete(`/revenue-adjustments/${id}`),
  
  reviewAdjustment: (id: string, data: any) => 
    http.post(`/revenue-adjustments/${id}/review`, data),
  
  getAdjustmentsByRevenueRecord: (revenueRecordId: string, clinicId: string) => 
    http.get(`/revenue-adjustments/revenue-record/${revenueRecordId}`, { params: { clinicId } }),
  
  getTotalAdjustmentByRevenueRecord: (revenueRecordId: string, clinicId: string) => 
    http.get(`/revenue-adjustments/revenue-record/${revenueRecordId}/total-adjustment`, { params: { clinicId } }),
};

export default api;