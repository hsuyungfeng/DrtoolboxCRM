import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  MinLength,
  Max,
} from "class-validator";

export class CreateTreatmentTemplateDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  defaultPrice: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  defaultSessions: number;

  @IsString()
  @MinLength(1)
  clinicId: string;
}
