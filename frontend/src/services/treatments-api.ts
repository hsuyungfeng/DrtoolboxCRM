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
    http.get<TreatmentCourse[]>('/treatment-courses', {
      params: {
        patientId,
        clinicId,
      },
    }),

  /**
   * 取得特定療程套餐詳細資訊
   */
  getCourse: (courseId: string, clinicId: string) =>
    http.get<TreatmentCourse>(`/treatment-courses/${courseId}`, {
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
  }) => http.post<TreatmentCourse>('/treatment-courses', data),

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
    http.put<TreatmentCourseSession>(`/treatment-sessions/${sessionId}`, data, {
      params: {
        clinicId,
      },
    }),

  /**
   * 取得所有可用的療程模板
   */
  getTemplates: (clinicId: string) =>
    http.get<TreatmentTemplate[]>('/treatment-templates', {
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
    http.get<TreatmentCourseSession[]>(`/staff-sessions/${staffId}/sessions`, {
      params: {
        clinicId,
        ...filters,
      },
    }),
};

export const treatmentSessionApi = {
  getAll: (clinicId: string) =>
    http.get<TreatmentSession[]>('/treatment-sessions', {
      params: { clinicId },
    }),

  getById: (id: string, clinicId: string) =>
    http.get<TreatmentSession>(`/treatment-sessions/${id}`, {
      params: { clinicId },
    }),

  create: (data: Partial<TreatmentSession>) =>
    http.post<TreatmentSession>('/treatment-sessions', data),

  update: (id: string, data: Partial<TreatmentSession>) =>
    http.put<TreatmentSession>(`/treatment-sessions/${id}`, data),

  delete: (id: string, clinicId: string) =>
    http.delete(`/treatment-sessions/${id}`, {
      params: { clinicId },
    }),
};

/**
 * 療程管理 API（供 TreatmentList / TreatmentDetail 使用）
 * 對應後端 /treatment-courses CRUD 端點
 */
export const treatmentsApi = {
  /**
   * 取得所有療程（含患者資訊）
   */
  getTreatments: (params?: { clinicId?: string; patientId?: string; status?: string }) =>
    http.get<Treatment[]>('/treatment-courses', { params }),

  /**
   * 取得單一療程詳情
   */
  getTreatment: (id: string, params?: { clinicId?: string }) =>
    http.get<TreatmentCourse>(`/treatment-courses/${id}`, { params }),

  /**
   * 建立新療程（基於範本選擇）
   */
  createTreatment: (data: {
    patientId: string;
    templateId: string;
    clinicId: string;
    pointsToRedeem?: number;
  }) => http.post<TreatmentCourse>('/treatment-courses', data),

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
  ) => http.patch<TreatmentCourse>(`/treatment-courses/${id}`, data),

  /**
   * 刪除療程
   */
  deleteTreatment: (id: string) => http.delete(`/treatment-courses/${id}`),

  /**
   * 標記課程為完成
   */
  completeSession: (sessionId: string) =>
    http.patch<TreatmentCourseSession>(`/treatment-sessions/${sessionId}/complete`, {}),
};

export default treatmentCoursesApi;
