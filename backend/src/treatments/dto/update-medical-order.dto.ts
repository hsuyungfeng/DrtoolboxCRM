/**
 * 更新醫令 DTO（Update Medical Order DTO）
 * 用於驗證醫師更新醫令時的請求資料
 * 所有欄位均為選填，支援部分更新操作
 */
import { IsString, IsInt, Min, IsOptional, MaxLength, IsIn } from "class-validator";

/** 有效的醫令狀態值列表 */
const VALID_MEDICAL_ORDER_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export class UpdateMedicalOrderDto {
  /** 藥物或治療名稱（選填，最多 200 字元） */
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "藥物或治療名稱不能超過 200 字元" })
  drugOrTreatmentName?: string;

  /** 詳細說明（選填） */
  @IsOptional()
  @IsString()
  description?: string;

  /** 劑量說明（選填，最多 100 字元） */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "劑量說明不能超過 100 字元" })
  dosage?: string;

  /** 使用方式（選填，最多 100 字元） */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "使用方式不能超過 100 字元" })
  usageMethod?: string;

  /** 總療程數（選填，最少 1 次） */
  @IsOptional()
  @IsInt({ message: "療程數必須是整數" })
  @Min(1, { message: "療程數最少為 1" })
  totalSessions?: number;

  /** 已使用次數（選填，最少 0 次，用於更新療程進度） */
  @IsOptional()
  @IsInt({ message: "已使用次數必須是整數" })
  @Min(0, { message: "已使用次數不能為負" })
  completedSessions?: number;

  /**
   * 醫令狀態（選填）
   * 有效狀態：pending | in_progress | completed | cancelled
   */
  @IsOptional()
  @IsString()
  @IsIn(VALID_MEDICAL_ORDER_STATUSES, {
    message: "狀態必須是 pending、in_progress、completed 或 cancelled 其中之一",
  })
  status?: "pending" | "in_progress" | "completed" | "cancelled";
}
