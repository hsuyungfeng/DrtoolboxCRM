import { http } from './api';
import type { TreatmentCourse, TreatmentCourseSession, StaffAssignment, TreatmentTemplate, TreatmentSession, Treatment } from '@/types';

/**
 * 療程 API 服務層
 * 提供所有療程相關的 API 操作
 */
export const treatmentCoursesApi = {
  /**
   * 取得患者的所有療程套餐
   */
  getPatientCourses: (patientId: string, clinicId: string) =>
    http.get<TreatmentCourse[]>('/treatments/courses', {
      params: {
        patientId,
        clinicId,
      },
    }),

  /**
   * 取得特定療程套餐詳細資訊
   */
  getCourse: (courseId: string, clinicId: string) =>
    http.get<TreatmentCourse>(`/treatments/courses/${courseId}`, {
      params: {
        clinicId,
      },
    }),

  /**
   * 建立新的療程套餐
   */
  createCourse: (data: {
    patientId: string;
    templateId: string;
    clinicId: string;
    pointsToRedeem?: number;
  }) => http.post<TreatmentCourse>('/treatments/courses', data),

  /**
   * 更新療程會話
   */
  updateSession: (
    sessionId: string,
    data: {
      scheduledDate?: string;
      actualStartTime?: string;
      actualEndTime?: string;
      completionStatus?: 'pending' | 'completed' | 'cancelled';
      status?: 'pending' | 'completed' | 'cancelled';
      therapistNotes?: string;
      patientFeedback?: string;
      staffAssignments?: StaffAssignment[];
    },
    clinicId: string
  ) =>
    http.put<TreatmentCourseSession>(`/treatments/sessions/${sessionId}`, data, {
      params: {
        clinicId,
      },
    }),

  /**
   * 取得所有可用的療程模板
   */
  getTemplates: (clinicId: string) =>
    http.get<TreatmentTemplate[]>('/treatments/templates', {
      params: {
        clinicId,
      },
    }),

  /**
   * 取得員工的所有療程會話
   */
  getStaffSessions: (
    staffId: string,
    clinicId: string,
    filters?: {
      status?: 'pending' | 'completed' | 'cancelled';
      startDate?: string;
      endDate?: string;
    }
  ) =>
    http.get<TreatmentCourseSession[]>(`/staff/${staffId}/sessions`, {
      params: {
        clinicId,
        ...filters,
      },
    }),
};

export const treatmentSessionApi = {
  getAll: (clinicId: string) =>
    http.get<TreatmentSession[]>('/treatments/sessions', {
      params: { clinicId },
    }),

  getById: (id: string, clinicId: string) =>
    http.get<TreatmentSession>(`/treatments/sessions/${id}`, {
      params: { clinicId },
    }),

  create: (data: Partial<TreatmentSession>) =>
    http.post<TreatmentSession>('/treatments/sessions', data),

  update: (id: string, data: Partial<TreatmentSession>) =>
    http.put<TreatmentSession>(`/treatments/sessions/${id}`, data),

  delete: (id: string, clinicId: string) =>
    http.delete(`/treatments/sessions/${id}`, {
      params: { clinicId },
    }),
};

/**
 * 療程管理 API（供 TreatmentList / TreatmentDetail 使用）
 * 對應後端 /treatments/courses CRUD 端點
 */
export const treatmentsApi = {
  /**
   * 取得所有療程（含患者資訊）
   */
  getTreatments: (params?: { clinicId?: string; patientId?: string; status?: string }) =>
    http.get<Treatment[]>('/treatments/courses', { params }),

  /**
   * 取得單一療程詳情
   */
  getTreatment: (id: string, params?: { clinicId?: string }) =>
    http.get<TreatmentCourse>(`/treatments/courses/${id}`, { params }),

  /**
   * 建立新療程（基於範本選擇）
   */
  createTreatment: (data: {
    patientId: string;
    templateId: string;
    clinicId: string;
    pointsToRedeem?: number;
  }) => http.post<TreatmentCourse>('/treatments/courses', data),

  /**
   * 更新療程資訊
   */
  updateTreatment: (
    id: string,
    data: {
      name?: string;
      type?: string;
      costPerSession?: number;
      totalSessions?: number;
      description?: string;
      status?: string;
    },
  ) => http.patch<TreatmentCourse>(`/treatments/courses/${id}`, data),

  /**
   * 刪除療程
   */
  deleteTreatment: (id: string) => http.delete(`/treatments/courses/${id}`),

  /**
   * 標記課程為完成
   */
  completeSession: (sessionId: string) =>
    http.patch<TreatmentCourseSession>(`/treatments/sessions/${sessionId}/complete`, {}),
};

/**
 * 療程員工分配 API
 * 預留端點用於管理治療和員工之間的關聯
 */
export const treatmentStaffAssignmentApi = {
  /**
   * 為療程添加員工分配
   */
  addStaffAssignment: (treatmentId: string, data: { staffId: string; role: string; revenuePercentage?: number }) =>
    http.post(`/treatments/${treatmentId}/staff-assignments`, data),

  /**
   * 取得療程的所有員工分配
   */
  getStaffAssignments: (treatmentId: string) =>
    http.get(`/treatments/${treatmentId}/staff-assignments`),

  /**
   * 更新員工分配
   */
  updateStaffAssignment: (treatmentId: string, assignmentId: string, data: Partial<{ role: string; revenuePercentage: number }>) =>
    http.put(`/treatments/${treatmentId}/staff-assignments/${assignmentId}`, data),

  /**
   * 刪除員工分配
   */
  removeStaffAssignment: (treatmentId: string, assignmentId: string) =>
    http.delete(`/treatments/${treatmentId}/staff-assignments/${assignmentId}`),
};

export default treatmentCoursesApi;
