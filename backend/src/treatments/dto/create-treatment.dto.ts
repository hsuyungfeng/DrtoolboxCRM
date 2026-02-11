import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Length,
  Min,
  Max,
  IsEnum,
} from "class-validator";

export class CreateTreatmentDto {
  @IsString()
  @Length(1, 32)
  patientId: string;

  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  treatmentTemplateId?: string;

  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  totalPrice: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  totalSessions: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  completedSessions?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  status?: string; // pending, in_progress, completed, cancelled

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: Date;

  @IsOptional()
  @IsDateString()
  actualEndDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @Length(1, 32)
  clinicId: string;
}
