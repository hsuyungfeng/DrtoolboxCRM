import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  Length,
  IsEnum,
} from "class-validator";
import { StaffRole } from "../enums/staff-role.enum";

export class CreateStaffDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsEmail()
  @Length(1, 255)
  email: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone?: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  specialty?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  status?: string; // active, inactive

  @IsString()
  @Length(1, 32)
  clinicId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999999.99)
  baseSalary?: number;

  @IsOptional()
  @IsBoolean()
  canBeReferrer?: boolean; // 是否可以作為推薦人
}
