import { Exclude } from 'class-transformer';

/**
 * 療程課程響應 DTO（醫護視圖）
 * Treatment Session Response DTO - staff view
 */
export class TreatmentSessionResponseDto {
  /** 課程 ID */
  id: string;

  /** 所屬療程 ID */
  treatmentCourseId: string;

  /** 課程序號（1 起）*/
  sessionNumber: number;

  /** 課程狀態（scheduled/in_progress/completed/cancelled） */
  status: string;

  /** 完成狀態（pending/completed/abandoned） */
  completionStatus: 'pending' | 'completed' | 'abandoned';

  /** 完成時間 */
  completedAt?: Date;

  /** 排程日期 */
  scheduledDate?: Date;

  /** 建立時間 */
  createdAt: Date;

  /** 更新時間 */
  updatedAt: Date;

  /**
   * 醫護人員分配記錄
   * Staff assignments for this session
   */
  staffAssignments?: {
    id: string;
    staffId: string;
    staffName: string;
    staffRole: string;
    ppfPercentage: number;
    assignedAt: Date;
  }[];
}

/**
 * 療程完整響應 DTO（醫護視圖）
 * Full Treatment Course Response DTO - staff/admin view
 * 包含所有欄位，供醫護人員使用
 */
export class TreatmentCourseResponseDto {
  /** 療程 ID */
  id: string;

  /** 患者 ID */
  patientId: string;

  /** 診所 ID */
  clinicId: string;

  /** 療程模板 ID（可選） */
  templateId?: string;

  /** 療程名稱 */
  name: string;

  /** 療程類型 */
  type: string;

  /** 療程描述 */
  description?: string;

  /** 每次課程費用 */
  costPerSession: number;

  /** 療程總課程數 */
  totalSessions: number;

  /** 療程狀態（active/completed/abandoned） */
  status: 'active' | 'completed' | 'abandoned';

  /** 購買日期 */
  purchaseDate?: Date;

  /** 購買金額 */
  purchaseAmount?: number;

  /** 建立時間 */
  createdAt: Date;

  /** 更新時間 */
  updatedAt: Date;

  /** 完成時間 */
  completedAt?: Date;

  /**
   * 進度計算物件（即時衍生）
   * Progress object (derived in real-time from sessions)
   */
  progress?: {
    /** 課程總數 */
    totalSessions: number;
    /** 已完成課程數 */
    completedSessions: number;
    /** 待完成課程數 */
    pendingSessions: number;
    /** 完成百分比（0-100） */
    progressPercent: number;
    /** 是否全部完成 */
    isCompleted: boolean;
  };

  /**
   * 課程列表
   * Sessions list
   */
  sessions?: TreatmentSessionResponseDto[];
}

/**
 * 患者視圖療程 DTO（隱藏敏感欄位）
 * Treatment Course Patient View DTO
 * 患者只能看到部分資訊，隱藏診所 ID 和患者 ID
 */
export class TreatmentCoursePatientViewDto {
  /** 療程 ID */
  id: string;

  /** 療程名稱 */
  name: string;

  /** 療程類型 */
  type: string;

  /** 療程描述 */
  description?: string;

  /** 每次課程費用 */
  costPerSession: number;

  /** 療程狀態 */
  status: string;

  /** 建立時間 */
  createdAt: Date;

  /** 完成時間 */
  completedAt?: Date;

  /**
   * 進度計算物件（患者視圖，簡化版）
   * Progress object for patient view (simplified)
   */
  progress?: {
    /** 課程總數 */
    totalSessions: number;
    /** 已完成課程數 */
    completedSessions: number;
    /** 完成百分比（0-100） */
    progressPercent: number;
  };

  /**
   * 課程列表（患者視圖，不含 treatmentCourseId）
   * Sessions for patient view (without treatmentCourseId)
   */
  sessions?: Omit<TreatmentSessionResponseDto, 'treatmentCourseId'>[];

  /**
   * 隱藏診所 ID（患者不應知道診所識別碼）
   * Hidden clinic ID - patients should not see clinic identifier
   */
  @Exclude()
  clinicId: string;

  /**
   * 隱藏患者 ID（避免資訊洩漏）
   * Hidden patient ID - prevent information leakage
   */
  @Exclude()
  patientId: string;
}
