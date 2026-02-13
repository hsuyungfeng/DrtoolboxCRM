import {
  IsOptional,
  IsDate,
  IsEnum,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StaffAssignmentDto } from './staff-assignment.dto';

export class UpdateTreatmentSessionDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualStartTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualEndTime?: Date;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled'])
  completionStatus?: 'pending' | 'completed' | 'cancelled';

  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled'])
  status?: 'pending' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  therapistNotes?: string;

  @IsOptional()
  @IsString()
  patientFeedback?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAssignmentDto)
  staffAssignments?: StaffAssignmentDto[];
}
