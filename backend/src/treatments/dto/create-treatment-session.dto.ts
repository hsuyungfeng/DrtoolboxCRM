import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from "class-validator";

export class CreateTreatmentSessionDto {
  @IsString()
  treatmentId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  sessionIndex: number;

  @IsOptional()
  @IsDateString()
  scheduledTime?: Date;

  @IsOptional()
  @IsDateString()
  actualTime?: Date;

  @IsOptional()
  @IsString()
  status?: string; // scheduled, in_progress, completed, cancelled

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480) // 8 hours maximum
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  revenueCalculated?: boolean;

  @IsString()
  clinicId: string;
}
