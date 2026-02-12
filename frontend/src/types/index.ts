/**
 * 用戶類型
 */
export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  clinicId: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 患者類型
 */
export interface Patient {
  id: string;
  name: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  allergyHistory?: string;
  medicationRecord?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 員工類型
 */
export interface Staff {
  id: string;
  name: string;
  role: 'doctor' | 'therapist' | 'assistant' | 'consultant' | 'admin';
  specialty?: string;
  phone?: string;
  email?: string;
  baseSalary?: number;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 療程類型
 */
export interface Treatment {
  id: string;
  patientId: string;
  patient?: Patient;
  name: string;
  treatmentTemplateId?: string;
  totalPrice: number;
  totalSessions: number;
  completedSessions: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  notes?: string;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 療程次數類型
 */
export interface TreatmentSession {
  id: string;
  treatmentId: string;
  sessionIndex: number;
  scheduledTime: string;
  actualTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  observations?: string;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 分潤規則類型
 */
export interface RevenueRule {
  id: string;
  role: string;
  ruleType: 'percentage' | 'fixed' | 'tiered';
  rulePayload: Record<string, any>;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 分潤記錄類型
 */
export interface RevenueRecord {
  id: string;
  treatmentId: string;
  treatmentSessionId?: string;
  staffId: string;
  role: string;
  amount: number;
  calculationType: 'treatment' | 'session';
  status: 'pending' | 'calculated' | 'locked' | 'adjusted';
  calculatedAt: string;
  lockedAt?: string;
  paidAt?: string;
  calculationDetails?: Record<string, any>;
  clinicId: string;
  ruleId?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 分潤調整類型
 */
export interface RevenueAdjustment {
  id: string;
  revenueRecordId: string;
  staffId: string;
  adjustmentType: 'increase' | 'decrease';
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  clinicId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * API 響應類型
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * API 錯誤響應類型
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errorCode: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
  errors?: Array<{
    field: string;
    message: string;
    constraint?: string;
  }>;
}

/**
 * 分頁查詢參數
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 診所類型
 */
export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
}