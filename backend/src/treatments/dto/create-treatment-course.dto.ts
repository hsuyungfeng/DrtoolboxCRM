import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
} from "class-validator";

export class CreateTreatmentCourseDto {
  @IsNotEmpty({ message: "patientId 不能為空" })
  @IsString()
  patientId: string;

  @IsNotEmpty({ message: "templateId 不能為空" })
  @IsUUID()
  templateId: string;

  @IsNotEmpty({ message: "clinicId 不能為空" })
  @IsUUID()
  clinicId: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "pointsToRedeem 必須是有效的數字" },
  )
  @Min(0, { message: "pointsToRedeem 不能為負" })
  pointsToRedeem?: number;
}
