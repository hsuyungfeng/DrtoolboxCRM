import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class StaffAssignmentDto {
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @IsNotEmpty()
  @IsString()
  staffRole: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  ppfPercentage: number;
}
