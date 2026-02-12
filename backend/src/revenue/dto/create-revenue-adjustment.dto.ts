import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsNotEmpty, IsPositive, IsNegative, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRevenueAdjustmentDto {
  @ApiProperty({
    description: '分潤記錄 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  revenueRecordId: string;

  @ApiProperty({
    description: '調整金額（正數表示增加，負數表示減少）',
    example: -100.50,
  })
  @IsNumber()
  @Type(() => Number)
  adjustmentAmount: number;

  @ApiProperty({
    description: '調整原因',
    example: '客戶退款，需扣減分潤',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: '創建者 ID（員工 ID）',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: '診所 ID',
    example: 'clinic_001',
  })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiProperty({
    description: '附加元數據',
    example: { refundId: 'REF-20250209-001', approvedBy: 'manager_001' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}