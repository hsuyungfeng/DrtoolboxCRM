import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * 更新療程 DTO
 * 用於更新療程的允許欄位（不含課程）
 *
 * Update Treatment Course DTO
 * Used to update allowed fields of a treatment course (excluding sessions)
 */
export class UpdateTreatmentCourseDto {
  /**
   * 療程名稱
   * Treatment course name
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  /**
   * 療程描述
   * Treatment course description
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 每次課程費用
   * Cost per session
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPerSession?: number;

  /**
   * 療程狀態
   * Treatment course status
   */
  @IsOptional()
  @IsString()
  @IsIn(['active', 'completed', 'abandoned'], {
    message: '療程狀態必須是 active、completed 或 abandoned 之一',
  })
  status?: 'active' | 'completed' | 'abandoned';
}
