import { http } from './api';

export interface CustomMedicalOrder {
  code: string;
  nameEn: string;
  nameZh: string;
  points: number;
  paymentType: 'self-pay' | 'nhi';
}

export interface CustomRevenueRule {
  staffIdOrRole: string;
  ruleType: 'percentage' | 'fixed';
  value: number;
}

export interface TreatmentTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  defaultSessions: number;
  clinicId: string;
  isActive: boolean;
  customMedicalOrders?: CustomMedicalOrder[];
  customRevenueRules?: CustomRevenueRule[];
  followUpIntervalDays?: number;
  createdAt: string;
  updatedAt: string;
}

export const treatmentTemplatesApi = {
  create: (data: Partial<TreatmentTemplate>) =>
    http.post<TreatmentTemplate>('/treatment-templates', data),

  getAll: (clinicId: string, params?: any) =>
    http.get<TreatmentTemplate[]>('/treatment-templates', {
      params: { clinicId, ...params },
    }),

  getById: (id: string, clinicId: string) =>
    http.get<TreatmentTemplate>(`/treatment-templates/${id}`, {
      params: { clinicId },
    }),

  update: (id: string, clinicId: string, data: Partial<TreatmentTemplate>) =>
    http.put<TreatmentTemplate>(`/treatment-templates/${id}`, data, {
      params: { clinicId },
    }),

  delete: (id: string, clinicId: string) =>
    http.delete<void>(`/treatment-templates/${id}`, {
      params: { clinicId },
    }),
};
