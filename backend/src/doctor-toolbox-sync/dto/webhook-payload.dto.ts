import {
  IsString,
  IsEnum,
  IsNumber,
  IsEmail,
  IsOptional,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Doctor Toolbox Webhook 事件類型
 */
export enum WebhookAction {
  PATIENT_CREATED = 'patient_created',
  PATIENT_UPDATED = 'patient_updated',
  PATIENT_DELETED = 'patient_deleted',
}

/**
 * Doctor Toolbox 患者資料 DTO
 * 嵌套於 WebhookPayloadDto.patient
 */
export class ToolboxPatientDto {
  /**
   * Doctor Toolbox 患者ID
   */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  id: string;

  /**
   * 患者姓名
   */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  /**
   * 患者身份證號
   */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  idNumber: string;

  /**
   * 患者電話
   */
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  phone: string;

  /**
   * 患者電子郵件（可選）
   */
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;
}

/**
 * Doctor Toolbox Webhook 承載 DTO
 *
 * 用途：驗證來自 Doctor Toolbox 的 Webhook 事件承載
 * 嚴格模式：額外欄位將拋出驗證錯誤（遵循 CONTEXT.md）
 */
export class WebhookPayloadDto {
  /**
   * Webhook 事件ID — 用於冪等性（防止重複同步）
   */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  webhookId: string;

  /**
   * 診所 ID — 用於多診所隔離
   */
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  clinicId: string;

  /**
   * Doctor Toolbox 患者ID
   */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  patientId: string;

  /**
   * Webhook 事件類型
   */
  @IsEnum(WebhookAction)
  action: WebhookAction;

  /**
   * 事件時間戳（Unix timestamp，單位：秒）
   * 用於防重放攻擊和時序驗證
   */
  @IsNumber()
  timestamp: number;

  /**
   * 患者資料
   */
  @ValidateNested()
  @Type(() => ToolboxPatientDto)
  patient: ToolboxPatientDto;
}
