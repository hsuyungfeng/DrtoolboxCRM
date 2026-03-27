/**
 * 醫令響應 DTO（Medical Order Response DTOs）
 * 定義 API 響應的資料格式，支援不同角色的資訊視圖
 *
 * - MedicalOrderResponseDto：完整醫令資訊（醫護人員視圖）
 * - MedicalOrderPatientViewDto：患者視圖，隱藏敏感資訊（醫師 ID、診所 ID）
 */
import { Exclude, Expose } from 'class-transformer';

/**
 * 醫令響應 DTO（醫護人員完整視圖）
 * 包含所有醫令欄位和計算欄位
 */
export class MedicalOrderResponseDto {
  /** 醫令唯一識別碼 */
  id: string;

  /** 診所識別碼（多租戶隔離） */
  clinicId: string;

  /** 患者識別碼 */
  patientId: string;

  /** 開立醫師/醫護人員識別碼 */
  prescribedBy: string;

  /** 藥物或治療名稱 */
  drugOrTreatmentName: string;

  /** 詳細說明（選填） */
  description?: string;

  /** 劑量說明（例如：「500mg x 3」） */
  dosage: string;

  /** 使用方式（例如：「口服」、「每日 2 次」） */
  usageMethod: string;

  /** 總療程數 */
  totalSessions: number;

  /** 已使用次數 */
  completedSessions: number;

  /** 醫令狀態：pending | in_progress | completed | cancelled */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  /** 開始日期（首次使用時記錄） */
  startedAt?: Date;

  /** 完成/取消日期 */
  completedAt?: Date;

  /** 創建時間 */
  createdAt: Date;

  /** 更新時間 */
  updatedAt: Date;

  /** 進度百分比（計算欄位，0-100） */
  progressPercent?: number;

  /** 剩餘療程數（計算欄位） */
  remainingCount?: number;
}

/**
 * 醫令患者視圖 DTO
 * 隱藏敏感資訊（醫師 ID、診所 ID），適用於患者查看自己的醫令
 */
export class MedicalOrderPatientViewDto {
  /** 醫令唯一識別碼 */
  id: string;

  /** 藥物或治療名稱 */
  drugOrTreatmentName: string;

  /** 詳細說明（選填） */
  description?: string;

  /** 劑量說明 */
  dosage: string;

  /** 使用方式 */
  usageMethod: string;

  /** 總療程數 */
  totalSessions: number;

  /** 已使用次數 */
  completedSessions: number;

  /** 醫令狀態：pending | in_progress | completed | cancelled */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  /** 開始日期 */
  startedAt?: Date;

  /** 完成日期 */
  completedAt?: Date;

  /** 創建時間 */
  createdAt: Date;

  /** 進度百分比（計算欄位，0-100） */
  progressPercent?: number;

  /** 剩餘療程數（計算欄位） */
  remainingCount?: number;

  /**
   * 開立醫師 ID（患者視圖中排除）
   * 使用 @Exclude() 透過 class-transformer 序列化時自動移除
   */
  @Exclude()
  prescribedBy: string;

  /**
   * 診所 ID（患者視圖中排除）
   * 使用 @Exclude() 透過 class-transformer 序列化時自動移除
   */
  @Exclude()
  clinicId: string;
}
