import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsJSON,
  Length,
} from "class-validator";

export class CreateRevenueRuleDto {
  @IsString()
  @Length(1, 50)
  role: string; // doctor, therapist, assistant, consultant

  @IsString()
  @Length(1, 50)
  ruleType: string; // percentage, fixed, tiered

  @IsJSON()
  rulePayload: any; // 规则参数，如百分比、金额、阶梯条件

  @IsDateString()
  effectiveFrom: Date;

  @IsOptional()
  @IsDateString()
  effectiveTo?: Date;

  @IsString()
  @Length(1, 32)
  clinicId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}
