/**
 * 創建醫令 DTO（Create Medical Order DTO）
 * 用於驗證醫師創建新醫令時的請求資料
 * 所有必填欄位均通過 class-validator 裝飾器進行驗證
 */
import {
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from "class-validator";

export class CreateMedicalOrderDto {
  /** 患者識別碼（必填，必須是有效的 UUID） */
  @IsUUID()
  @IsNotEmpty({ message: "patientId 不能為空" })
  patientId: string;

  /** 藥物或治療名稱（必填，最多 200 字元） */
  @IsString()
  @IsNotEmpty({ message: "藥物或治療名稱不能為空" })
  @MaxLength(200, { message: "藥物或治療名稱不能超過 200 字元" })
  drugOrTreatmentName: string;

  /** 詳細說明（選填） */
  @IsOptional()
  @IsString()
  description?: string;

  /** 劑量說明（必填，最多 100 字元，例如：「500mg x 3」） */
  @IsString()
  @IsNotEmpty({ message: "劑量不能為空" })
  @MaxLength(100, { message: "劑量說明不能超過 100 字元" })
  dosage: string;

  /** 使用方式（必填，最多 100 字元，例如：「口服」、「每日 2 次」） */
  @IsString()
  @IsNotEmpty({ message: "使用方式不能為空" })
  @MaxLength(100, { message: "使用方式不能超過 100 字元" })
  usageMethod: string;

  /** 總療程數（必填，最少 1 次） */
  @IsInt({ message: "療程數必須是整數" })
  @Min(1, { message: "療程數最少為 1" })
  totalSessions: number;

  /** 醫令模板識別碼（選填，可從模板快速建立醫令） */
  @IsOptional()
  @IsUUID()
  scriptTemplateId?: string;
}
