import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * 創建推薦 DTO
 * 用於創建新的推薦記錄
 */
export class CreateReferralDto {
  /**
   * 推薦人 ID (Staff 或 Patient 的 ID)
   * 長度限制：1-32 個字符
   */
  @IsNotEmpty({ message: '推薦人 ID 不能為空' })
  @IsString({ message: '推薦人 ID 必須是字符串' })
  @MinLength(1, { message: '推薦人 ID 不能為空' })
  @MaxLength(32, { message: '推薦人 ID 最多 32 個字符' })
  referrerId: string;

  /**
   * 推薦人類型：'staff' | 'patient'
   */
  @IsNotEmpty({ message: '推薦人類型不能為空' })
  @IsEnum(['staff', 'patient'], {
    message: '推薦人類型必須是 "staff" 或 "patient"',
  })
  referrerType: 'staff' | 'patient';

  /**
   * 被推薦患者 ID
   * 長度限制：1-32 個字符
   */
  @IsNotEmpty({ message: '患者 ID 不能為空' })
  @IsString({ message: '患者 ID 必須是字符串' })
  @MinLength(1, { message: '患者 ID 不能為空' })
  @MaxLength(32, { message: '患者 ID 最多 32 個字符' })
  patientId: string;

  /**
   * 診所 ID
   * 長度限制：1-32 個字符
   */
  @IsNotEmpty({ message: '診所 ID 不能為空' })
  @IsString({ message: '診所 ID 必須是字符串' })
  @MinLength(1, { message: '診所 ID 不能為空' })
  @MaxLength(32, { message: '診所 ID 最多 32 個字符' })
  clinicId: string;

  /**
   * 推薦備註（可選）
   */
  @IsOptional()
  @IsString({ message: '備註必須是字符串' })
  notes?: string;
}
