import { http } from './api';

/**
 * 醫令資料型別
 */
export interface MedicalOrder {
  id: string;
  patientId: string;
  patientName?: string;
  /** 藥物或治療名稱 */
  drugOrTreatmentName: string;
  /** 說明 */
  description?: string;
  /** 劑量 */
  dosage: string;
  /** 使用方式 */
  usageMethod: string;
  /** 療程數（總次數） */
  totalUsage: number;
  /** 已使用數 */
  usedCount: number;
  /** 狀態 */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 建立醫令請求資料
 */
export interface CreateMedicalOrderData {
  patientId: string;
  drugOrTreatmentName: string;
  description?: string;
  dosage: string;
  usageMethod: string;
  totalUsage: number;
}

/**
 * 更新醫令請求資料
 */
export interface UpdateMedicalOrderData {
  drugOrTreatmentName?: string;
  description?: string;
  dosage?: string;
  usageMethod?: string;
  totalUsage?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

/**
 * 醫令 API 服務
 * 提供所有醫令相關的 API 操作
 */
export const medicalOrdersApi = {
  /**
   * 建立新醫令
   */
  createOrder: (data: CreateMedicalOrderData) =>
    http.post<MedicalOrder>('/medical-orders', data),

  /**
   * 取得單一醫令詳情
   */
  getOrder: (id: string) =>
    http.get<MedicalOrder>(`/medical-orders/${id}`),

  /**
   * 更新醫令資訊
   */
  updateOrder: (id: string, data: UpdateMedicalOrderData) =>
    http.patch<MedicalOrder>(`/medical-orders/${id}`, data),

  /**
   * 取得患者的醫令列表
   */
  getPatientOrders: (patientId: string, status?: string) =>
    http.get<MedicalOrder[]>(`/patients/${patientId}/medical-orders`, {
      params: { status },
    }),

  /**
   * 取得所有醫令（醫師管理視圖）
   */
  getOrders: (params?: { status?: string; patientId?: string }) =>
    http.get<MedicalOrder[]>('/medical-orders', { params }),

  /**
   * 記錄醫令使用次數（增量更新）
   */
  recordUsage: (id: string, usedCount: number) =>
    http.post<MedicalOrder>(`/medical-orders/${id}/use`, {
      usedCount,
    }),

  /**
   * 取消醫令
   */
  cancelOrder: (id: string) =>
    http.delete<void>(`/medical-orders/${id}`),
};

export default medicalOrdersApi;
