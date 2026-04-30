import api from './api';

export interface Lead {
  id: string;
  clinicId: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  source?: string;
  estimatedValue: number;
  status: 'new' | 'contacted' | 'consulted' | 'converted' | 'lost';
  notes?: string;
  convertedPatientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadDto {
  name: string;
  phoneNumber?: string;
  email?: string;
  source?: string;
  estimatedValue?: number;
  notes?: string;
}

export const leadsApi = {
  findAll: () => api.get<Lead[]>('/leads'),
  findOne: (id: string) => api.get<Lead>(`/leads/${id}`),
  create: (data: CreateLeadDto) => api.post<Lead>('/leads', data),
  update: (id: string, data: Partial<Lead>) => api.patch<Lead>(`/leads/${id}`, data),
  updateStatus: (id: string, status: Lead['status']) => api.patch<Lead>(`/leads/${id}/status`, { status }),
  convert: (id: string, idNumber: string) => api.post<Lead>(`/leads/${id}/convert`, { idNumber }),
  remove: (id: string) => api.delete(`/leads/${id}`),
};
