import { http } from './api';
import type { TreatmentCourse, TreatmentCourseSession, StaffAssignment, TreatmentTemplate, TreatmentSession } from '@/types';

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

export default treatmentCoursesApi;
