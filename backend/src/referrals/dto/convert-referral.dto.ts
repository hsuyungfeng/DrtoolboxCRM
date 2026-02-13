import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

/**
 * 轉化推薦 DTO
 * 用於標記推薦為已轉化（患者完成首次療程）
 */
export class ConvertReferralDto {
  /**
   * 首次療程 ID
   * 長度限制：1-32 個字符
   */
  @IsNotEmpty({ message: "療程 ID 不能為空" })
  @IsString({ message: "療程 ID 必須是字符串" })
  @MinLength(1, { message: "療程 ID 不能為空" })
  @MaxLength(32, { message: "療程 ID 最多 32 個字符" })
  treatmentId: string;

  /**
   * 診所 ID
   * 長度限制：1-32 個字符
   */
  @IsNotEmpty({ message: "診所 ID 不能為空" })
  @IsString({ message: "診所 ID 必須是字符串" })
  @MinLength(1, { message: "診所 ID 不能為空" })
  @MaxLength(32, { message: "診所 ID 最多 32 個字符" })
  clinicId: string;
}
