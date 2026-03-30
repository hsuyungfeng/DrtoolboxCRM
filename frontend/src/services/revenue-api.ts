import api from './api';

/**
 * 支付 API（FIN-02/05）
 * 記錄患者付款、查詢費用餘額
 */
export const paymentApi = {
  /** 記錄患者付款 */
  createPayment: (data: {
    treatmentId: string;
    patientId: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'credit_card';
    paidAt?: string;
    notes?: string;
  }) => api.post('/payments', data),

  /** 療程付款列表 */
  getByTreatment: (treatmentId: string) =>
    api.get(`/payments/treatment/${treatmentId}`),

  /** 費用餘額查詢 */
  getBalance: (treatmentId: string) =>
    api.get(`/payments/balance/${treatmentId}`),

  /** 患者所有付款 */
  getByPatient: (patientId: string) =>
    api.get(`/payments/patient/${patientId}`),

  /** 取消付款 */
  cancelPayment: (id: string) => api.delete(`/payments/${id}`),
};

/**
 * 發票 API（FIN-04）
 * 發票生成、開立、取消
 */
export const invoiceApi = {
  /** 生成草稿發票 */
  createInvoice: (data: { treatmentId: string; patientId: string }) =>
    api.post('/invoices', data),

  /** 療程發票列表 */
  getByTreatment: (treatmentId: string) =>
    api.get(`/invoices/treatment/${treatmentId}`),

  /** 患者發票列表 */
  getByPatient: (patientId: string) =>
    api.get(`/invoices/patient/${patientId}`),

  /** 確認開立（draft → issued） */
  issueInvoice: (id: string) => api.patch(`/invoices/${id}/issue`),

  /** 取消發票 */
  cancelInvoice: (id: string, reason?: string) =>
    api.patch(`/invoices/${id}/cancel`, { reason }),
};

/**
 * 報表 API（FIN-06）
 * 收入統計報表、月趨勢、支付方式分布、人員分潤
 */
export const reportApi = {
  /** 收入總覽（預設當月） */
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/revenue-reports/summary', { params }),

  /** 近 12 個月趨勢（ECharts 長條圖資料） */
  getMonthlyTrend: () => api.get('/revenue-reports/monthly-trend'),

  /** 支付方式分布（ECharts 環形圖資料） */
  getPaymentMethods: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/revenue-reports/payment-methods', { params }),

  /** 醫護人員分潤統計 */
  getStaffRevenue: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/revenue-reports/staff', { params }),
};
