import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

class CustomMedicalOrderDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  nameZh: string;

  @IsNumber()
  @Min(0)
  points: number;

  @IsString()
  @IsIn(["self-pay", "nhi"])
  paymentType: "self-pay" | "nhi";
}

class CustomRevenueRuleDto {
  @IsString()
  @IsNotEmpty()
  staffIdOrRole: string;

  @IsString()
  @IsIn(["percentage", "fixed"])
  ruleType: "percentage" | "fixed";

  @IsNumber()
  @Min(0)
  value: number;
}

export class CreateTreatmentTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  defaultPrice: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  defaultSessions: number;

  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomMedicalOrderDto)
  customMedicalOrders?: CustomMedicalOrderDto[];

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CustomRevenueRuleDto)
  customRevenueRules?: CustomRevenueRuleDto[];

  @IsInt()
  @IsOptional()
  @Min(0)
  followUpIntervalDays?: number;
}
